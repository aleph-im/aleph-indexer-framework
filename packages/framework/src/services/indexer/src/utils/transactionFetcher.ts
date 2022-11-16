import { EventEmitter } from 'node:events'

import {
  ParsedTransactionV1,
  PendingWork,
  PendingWorkPool,
  StorageValueStream,
  Utils,
} from '@aleph-indexer/core'
import { FetcherMsClient } from '../../../fetcher/client.js'
import { NonceTimestamp } from './nonce.js'
import {
  TransactionRequest,
  TransactionRequestParams,
  TransactionRequestStorage,
  TransactionRequestType,
} from '../dal/transactionRequest.js'
import {
  TransactionRequestPendingSignature,
  TransactionRequestPendingSignatureStorage,
  TransactionRequestPendingSignatureDALIndex,
} from '../dal/transactionRequestPendingSignature.js'
import {
  TransactionRequestResponse,
  TransactionRequestResponseStorage,
  TransactionRequestResponseDALIndex,
  TransactionParsedResponse,
} from '../dal/transactionRequestResponse.js'
import {
  AccountDateRange,
  AccountSlotRange,
  GetTransactionPendingRequestsRequestArgs,
} from '../types.js'
import { TransactionRequestIncomingTransactionStorage } from '../dal/transactionRequestIncomingTransaction.js'
import { DateTime } from "luxon";

const {
  Future,
  BufferExec,
  JobRunner,
  DebouncedJob,
  Mutex,
  arrayFromAsyncIterator,
} = Utils

export interface TransactionResponse {
  request: TransactionRequest
  response: StorageValueStream<TransactionParsedResponse>
  remove: () => Promise<void>
}

export class TransactionFetcher {
  protected checkPendingRetriesJob!: Utils.JobRunner
  protected checkCompletionJob!: Utils.DebouncedJob<void>
  protected requestFutures: Record<number, Utils.Future<number>> = {}
  protected requestMutex = new Mutex()
  protected events: EventEmitter = new EventEmitter()
  protected incomingTransactions: PendingWorkPool<ParsedTransactionV1>

  protected toRemoveBuffer = new BufferExec<TransactionRequestPendingSignature>(
    async (pendings) => {
      console.log(`Removing ${pendings.length} pending signatures`)
      return this.transactionRequestPendingSignatureDAL.remove(pendings)
    },
    1000,
  )

  protected toRetryBuffer = new BufferExec<string>(async (signatures) => {
    console.log(`Retrying ${signatures.length} signatures`, signatures)
    return this.fetcherMsClient.fetchTransactionsBySignature({ signatures })
  }, 1000)

  // protected onTxsBuffer = new BufferExec<ParsedTransactionV1>(
  //   this.storeIncomingTxs.bind(this),
  //   1000,
  //   1000,
  // )

  constructor(
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: TransactionRequestStorage,
    protected transactionRequestIncomingTransactionDAL: TransactionRequestIncomingTransactionStorage,
    protected transactionRequestPendingSignatureDAL: TransactionRequestPendingSignatureStorage,
    protected transactionRequestResponseDAL: TransactionRequestResponseStorage,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    this.incomingTransactions = new PendingWorkPool({
      id: 'incoming-transactions',
      interval: 0,
      chunkSize: 1000,
      concurrency: 1,
      dal: this.transactionRequestIncomingTransactionDAL,
      handleWork: this.handleIncomingTxs.bind(this),
      checkComplete: async (): Promise<boolean> => true,
    })

    this.checkPendingRetriesJob = new JobRunner({
      name: `indexer-transaction-pending-retries`,
      interval: 1000 * 60 * 10,
      intervalFn: this.handlePendingRetries.bind(this),
    })

    this.checkCompletionJob = new DebouncedJob<void>(
      this.checkAllRequestCompletion.bind(this),
    )
  }

  async start(): Promise<void> {
    this.incomingTransactions.start().catch(() => 'ignore')
    this.checkPendingRetriesJob.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    this.incomingTransactions.stop().catch(() => 'ignore')
    this.checkPendingRetriesJob.stop().catch(() => 'ignore')
  }

  async fetchTransactionsBySignature(signatures: string[]): Promise<number> {
    return this.handleTransactionRequest({
      type: TransactionRequestType.BySignatures,
      params: { signatures },
    })
  }

  async fetchAccountTransactionsByDate({
    account,
    startDate,
    endDate,
  }: AccountDateRange): Promise<number> {
    return this.handleTransactionRequest({
      type: TransactionRequestType.ByDateRange,
      params: { account, startDate, endDate },
    })
  }

  // @todo: WIP
  async fetchAccountTransactionsBySlot({
    account,
    startSlot,
    endSlot,
  }: AccountSlotRange): Promise<number> {
    return this.handleTransactionRequest({
      type: TransactionRequestType.BySlotRange,
      params: { account, startSlot, endSlot },
    })
  }

  onResponse(handler: (nonce: number) => void): void {
    this.events.on('response', handler)
  }

  offResponse(handler: (nonce: number) => void): void {
    this.events.off('response', handler)
  }

  async getRequests(
    filters?: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]> {
    let requests: TransactionRequest[] = []

    if (filters?.nonce !== undefined) {
      const req = await this.transactionRequestDAL.get(filters.nonce.toString())
      requests = req ? [req] : requests
    } else {
      const requestsIt = await this.transactionRequestDAL.getAllValues()
      requests = await arrayFromAsyncIterator(requestsIt)
    }

    if (filters?.type !== undefined) {
      requests = requests.filter((item) => item.type === filters.type)
    }

    if (filters?.complete !== undefined) {
      requests = requests.filter((item) => {
        return (
          (filters.complete && item.complete) ||
          (!filters.complete && !item.complete)
        )
      })
    }

    const filterAcc = filters?.account
    if (filterAcc !== undefined) {
      requests = requests.filter(
        (item) =>
          item.type !== TransactionRequestType.BySignatures &&
          item.params?.account === filterAcc,
      )
    }

    const filterSig = filters?.signature
    if (filterSig !== undefined) {
      requests = requests.filter(
        (item) =>
          item.type === TransactionRequestType.BySignatures &&
          item.params.signatures.includes(filterSig),
      )
    }

    return requests
  }

  async onTxs(chunk: ParsedTransactionV1[]): Promise<void> {
    // await this.onTxsBuffer.add(chunk)
    return this.storeIncomingTxs(chunk)
  }

  async isRequestComplete(nonce: number): Promise<boolean> {
    const request = await this.transactionRequestDAL.get(nonce.toString())
    if (!request) throw new Error(`Request with nonce ${nonce} does not exists`)

    return !!request.complete
  }

  async awaitRequestComplete(nonce: number): Promise<void> {
    const request = await this.transactionRequestDAL.get(nonce.toString())
    if (!request) throw new Error(`Request with nonce ${nonce} does not exists`)

    if (!request.complete) {
      await this.getFuture(nonce).promise
    }
  }

  async getResponse(nonce: number): Promise<TransactionResponse> {
    const request = await this.transactionRequestDAL.get(nonce.toString())
    if (!request) throw new Error(`Request with nonce ${nonce} does not exists`)

    if (!request.complete) {
      await this.getFuture(nonce).promise
    }

    const response = (await this.transactionRequestResponseDAL
      .useIndex(TransactionRequestResponseDALIndex.NonceIndex)
      .getAllValuesFromTo([nonce], [nonce], {
        reverse: false,
      })) as StorageValueStream<TransactionParsedResponse>

    return {
      request,
      response,
      remove: async () => {
        console.log('----> REMOVE REQ 🎈', request.nonce)
        await this.transactionRequestDAL.remove(request)
        // @todo: Update nonceIndexes / Remove from transactionRequestResponseDAL
      },
    }
  }

  // async deleteResponse(nonce: number): Promise<void> {
  //   const request = await this.transactionRequestDAL.get(nonce.toString())
  //   if (!request || !request.complete) return

  //   await this.transactionRequestDAL.remove(request)
  // }

  protected async storeIncomingTxs(
    chunk: ParsedTransactionV1[],
  ): Promise<void> {
    const works = chunk.map((tx) => ({
      id: tx.signature,
      time: Date.now(),
      payload: tx,
    }))

    return this.incomingTransactions.addWork(works)
  }

  protected async handleIncomingTxs(
    works: PendingWork<ParsedTransactionV1>[],
  ): Promise<void> {
    const chunk = works.map((work) => work.payload)

    const now1 = Date.now()
    const release = await this.requestMutex.acquire()
    const now2 = Date.now()

    try {
      const requests = await this.transactionRequestDAL.getAllValues()

      let filteredTxs: ParsedTransactionV1[] = []
      let remainingTxs: ParsedTransactionV1[] = chunk
      let requestCount = 0
      const requestCountId = []

      for await (const request of requests) {
        const { nonce, complete } = request
        if (complete) continue

        const result = this.filterTxsByRequest(remainingTxs, request)
        filteredTxs = filteredTxs.concat(result.filteredTxs)
        remainingTxs = result.remainingTxs
        requestCount++
        requestCountId.push(nonce)
      }

      console.log(
        `Filtering txs ${filteredTxs.length} of ${chunk.length} by ${requestCount} pending requests`,
      )

      if (filteredTxs.length === 0) return

      const requestResponse =
        filteredTxs as unknown as TransactionRequestResponse[]

      const pendingSignatures =
        filteredTxs as unknown as TransactionRequestPendingSignature[]

      await this.transactionRequestResponseDAL.save(requestResponse)
      await this.transactionRequestPendingSignatureDAL.remove(pendingSignatures)

      this.checkCompletionJob.run().catch(() => 'ignore')
    } finally {
      release()
    }

    const elapsed1 = Date.now() - now1
    const elapsed2 = Date.now() - now2

    console.log(`onTxs time => ${elapsed1 / 1000} | ${elapsed2 / 1000}`)
  }

  protected filterTxsByRequest(
    txs: ParsedTransactionV1[],
    request: TransactionRequest,
  ): {
    filteredTxs: ParsedTransactionV1[]
    remainingTxs: ParsedTransactionV1[]
  } {
    const filteredTxs: ParsedTransactionV1[] = []
    const remainingTxs: ParsedTransactionV1[] = []

    switch (request.type) {
      case TransactionRequestType.ByDateRange: {
        const { account, startDate, endDate } = request.params

        for (const tx of txs) {
          if (!tx.parsed) {
            console.log(
              '👺 error incoming tx without parsed field',
              request.nonce,
              tx,
            )
            continue
          }

          const timestamp = (tx.blockTime || 0) * 1000

          let valid = timestamp >= startDate && timestamp <= endDate

          valid =
            valid &&
            tx.parsed.message.accountKeys.some(
              ({ pubkey }) => pubkey === account,
            )

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
      case TransactionRequestType.BySlotRange: {
        const { account, startSlot, endSlot } = request.params

        for (const tx of txs) {
          let valid = tx.slot >= startSlot && tx.slot <= endSlot

          valid =
            valid &&
            tx.parsed.message.accountKeys.some(
              ({ pubkey }) => pubkey === account,
            )

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
      case TransactionRequestType.BySignatures: {
        const { signatures } = request.params
        const sigSet = new Set(signatures)

        for (const tx of txs) {
          const valid = sigSet.has(tx.signature)

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
    }

    return { filteredTxs, remainingTxs }
  }

  protected async handleTransactionRequest(
    requestParams: TransactionRequestParams,
    waitForResponse = false,
  ): Promise<number> {
    const nonce = this.nonce.get()
    const future = this.getFuture(nonce)
    let count = 0

    // @note: Sometimes we receive the responses before inserting the pendings signatures on
    // the db, the purpose of this mutex is to avoid this
    const now1 = Date.now()
    const release = await this.requestMutex.acquire()
    const now2 = Date.now()

    try {
      const signaturesStream = await (async (): Promise<
        void | string[][] | AsyncIterable<string[]>
      > => {
        switch (requestParams.type) {
          case TransactionRequestType.BySignatures: {
            const { signatures } = requestParams.params
            await this.fetcherMsClient.fetchTransactionsBySignature({
              signatures,
            })
            return [signatures]
          }
          case TransactionRequestType.ByDateRange: {
            const { account, startDate, endDate } = requestParams.params
            return this.fetcherMsClient.fetchAccountTransactionsByDate({
              account,
              startDate,
              endDate,
            })
          }
          case TransactionRequestType.BySlotRange: {
            const { account, startSlot, endSlot } = requestParams.params
            return this.fetcherMsClient.fetchAccountTransactionsBySlot({
              account,
              startSlot,
              endSlot,
            })
          }
        }
      })()

      if (!signaturesStream)
        throw new Error(
          `Error fetching transactions by ${
            TransactionRequestType[requestParams.type]
          }`,
        )

      for await (const signatures of signaturesStream) {
        const pendingSignatures = signatures.map((signature) => {
          return { signature, nonces: [nonce] }
        })

        const requestResponse = signatures.map((signature, index) => {
          return { signature, nonceIndexes: { [nonce]: index } }
        })

        await this.transactionRequestResponseDAL.save(requestResponse)
        await this.transactionRequestPendingSignatureDAL.save(pendingSignatures)

        count++
      }

      const request = { nonce, complete: !count, ...requestParams }
      await this.transactionRequestDAL.save(request)
    } finally {
      release()
    }

    const elapsed1 = Date.now() - now1
    const elapsed2 = Date.now() - now2
    console.log(`onRequest time => ${elapsed1 / 1000} | ${elapsed2 / 1000}`)

    console.log(`🟡 Request ${nonce} inited`)

    if (!count) {
      console.log(`🟢 Request ${nonce} complete`)
      this.resolveFuture(nonce)
    }

    // @note: Will be resolved when the requested txs come asynchronously
    if (waitForResponse) {
      await future.promise
    }

    return nonce
  }

  protected async checkAllRequestCompletion(): Promise<void> {
    const requests = await this.transactionRequestDAL.getAllValues()

    for await (const request of requests) {
      await this.checkRequestCompletion(request)
    }
  }

  protected async checkRequestCompletion(
    request: TransactionRequest,
  ): Promise<void> {
    const { nonce, complete } = request
    if (complete) return

    const pending = await this.transactionRequestPendingSignatureDAL
      .useIndex(TransactionRequestPendingSignatureDALIndex.NonceSignature)
      .getFirstKeyFromTo([nonce], [nonce], { atomic: true })

    if (pending) {
      console.log(`🔴 Request ${nonce} pending`)
      return
    }

    await this.transactionRequestDAL.save({ ...request, complete: true })
    console.log(`🟢 Request ${nonce} complete`)

    this.resolveFuture(nonce)
  }

  protected async checkAllPendingSignatures(): Promise<void> {
    const requests = await this.transactionRequestDAL.getAllValues()

    for await (const request of requests) {
      await this.checkPendingSignatures(request, false)
    }

    await this.drainPendingSignaturesBuffer()
  }

  protected async checkPendingSignatures(
    request: TransactionRequest,
    drain = true,
  ): Promise<void> {
    const { nonce } = request

    const pendings = await this.transactionRequestPendingSignatureDAL
      .useIndex(TransactionRequestPendingSignatureDALIndex.NonceSignature)
      .getAllValuesFromTo([nonce], [nonce], { atomic: true })

    for await (const pending of pendings) {
      const { signature } = pending

      const tx = await this.transactionRequestResponseDAL.get(signature)

      console.log(
        `[Retry] Check ${tx?.signature}`,
        !!tx,
        tx && 'parsed' in (tx || {}),
        tx && tx.nonceIndexes[nonce] >= 0,
        request.nonce,
      )

      const hasResponse = !!tx && 'parsed' in tx && tx.nonceIndexes[nonce] >= 0

      hasResponse
        ? await this.toRemoveBuffer.add(pending)
        : await this.toRetryBuffer.add(pending.signature)
    }

    if (drain) {
      await this.drainPendingSignaturesBuffer()
    }
  }

  protected async drainPendingSignaturesBuffer(): Promise<void> {
    await this.toRemoveBuffer.drain()
    await this.toRetryBuffer.drain()
  }

  protected async handlePendingRetries(): Promise<void> {
    await this.checkAllPendingSignatures()
    await this.checkCompletionJob.run()
  }

  protected getFuture(nonce: number): Utils.Future<number> {
    let future = this.requestFutures[nonce]

    if (!future) {
      future = new Future<number>()
      this.requestFutures[nonce] = future
    }

    return future
  }

  protected resolveFuture(nonce: number): void {
    this.requestFutures[nonce]?.resolve(nonce)

    setImmediate(() => {
      this.events.emit('response', nonce)
      delete this.requestFutures[nonce]
    })
  }
}
