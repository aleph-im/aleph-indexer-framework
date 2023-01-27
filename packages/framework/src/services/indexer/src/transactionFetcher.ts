import { EventEmitter } from 'node:events'
import {
  PendingWork,
  PendingWorkPool,
  StorageValueStream,
  Utils,
} from '@aleph-indexer/core'
import { FetcherMsClient } from '../../fetcher/client.js'
import { NonceTimestamp } from './nonce.js'
import {
  TransactionRequest,
  TransactionRequestParams,
  TransactionRequestStorage,
  TransactionRequestType,
} from './dal/transactionRequest.js'
import {
  TransactionRequestPendingSignature,
  TransactionRequestPendingSignatureStorage,
  TransactionRequestPendingSignatureDALIndex,
} from './dal/transactionRequestPendingSignature.js'
import {
  TransactionRequestResponse,
  TransactionRequestResponseStorage,
  TransactionRequestResponseDALIndex,
  TransactionParsedResponse,
} from './dal/transactionRequestResponse.js'
import { TransactionRequestIncomingTransactionStorage } from './dal/transactionRequestIncomingTransaction.js'
import {
  AccountDateRange,
  AccountSlotRange,
  GetTransactionPendingRequestsRequestArgs,
  SignatureRange,
} from './types.js'
import { Blockchain, ParsedTransaction } from '../../../types.js'

const {
  Future,
  BufferExec,
  JobRunner,
  DebouncedJob,
  Mutex,
  arrayFromAsyncIterator,
} = Utils

export interface TransactionResponse<T> {
  request: TransactionRequest
  response: StorageValueStream<T>
  remove: () => Promise<void>
}

export abstract class BaseIndexerTransactionFetcher<
  T extends ParsedTransaction<unknown>,
> {
  protected checkPendingRetriesJob!: Utils.JobRunner
  protected checkCompletionJob!: Utils.DebouncedJob<void>
  protected requestFutures: Record<number, Utils.Future<number>> = {}
  protected requestMutex = new Mutex()
  protected events: EventEmitter = new EventEmitter()
  protected incomingTransactions: PendingWorkPool<T>
  protected toRetryBuffer: Utils.BufferExec<TransactionRequestPendingSignature>
  protected toRemoveBuffer: Utils.BufferExec<TransactionRequestPendingSignature>

  constructor(
    protected blockchainId: Blockchain,
    protected fetcherMsClient: FetcherMsClient,
    protected transactionRequestDAL: TransactionRequestStorage,
    protected transactionRequestIncomingTransactionDAL: TransactionRequestIncomingTransactionStorage<T>,
    protected transactionRequestPendingSignatureDAL: TransactionRequestPendingSignatureStorage,
    protected transactionRequestResponseDAL: TransactionRequestResponseStorage<T>,
    protected nonce: NonceTimestamp = new NonceTimestamp(),
  ) {
    this.incomingTransactions = new PendingWorkPool({
      id: 'incoming-transactions',
      interval: 0,
      chunkSize: 1000,
      concurrency: 1,
      dal: this.transactionRequestIncomingTransactionDAL,
      handleWork: this.handleIncomingTransactions.bind(this),
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

    this.toRetryBuffer = new BufferExec<TransactionRequestPendingSignature>(
      this.handleRetryPendingTransactions.bind(this),
      1000,
    )

    this.toRemoveBuffer = new BufferExec<TransactionRequestPendingSignature>(
      this.handleRemovePendingTransactions.bind(this),
      1000,
    )
  }

  async start(): Promise<void> {
    await this.incomingTransactions.start()
    this.checkPendingRetriesJob.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    await this.incomingTransactions.stop()
    this.checkPendingRetriesJob.stop().catch(() => 'ignore')
  }

  async fetchTransactionsBySignature(params: SignatureRange): Promise<number> {
    return this.handleTransactionRequest({
      type: TransactionRequestType.BySignatures,
      params,
    })
  }

  async fetchAccountTransactionsByDate(
    params: AccountDateRange,
  ): Promise<number> {
    return this.handleTransactionRequest({
      type: TransactionRequestType.ByDateRange,
      params,
    })
  }

  // @todo: WIP
  async fetchAccountTransactionsBySlot(
    params: AccountSlotRange,
  ): Promise<number> {
    return this.handleTransactionRequest({
      type: TransactionRequestType.BySlotRange,
      params,
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

  async onTxs(chunk: T[]): Promise<void> {
    return this.storeIncomingTransactions(chunk)
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

  async getResponse(nonce: number): Promise<TransactionResponse<T>> {
    const request = await this.transactionRequestDAL.get(nonce.toString())
    if (!request) throw new Error(`Request with nonce ${nonce} does not exists`)

    if (!request.complete) {
      await this.getFuture(nonce).promise
    }

    const response = (await this.transactionRequestResponseDAL
      .useIndex(TransactionRequestResponseDALIndex.NonceIndex)
      .getAllValuesFromTo([nonce], [nonce], {
        reverse: false,
      })) as StorageValueStream<TransactionParsedResponse<T>>

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

  protected async storeIncomingTransactions(chunk: T[]): Promise<void> {
    const works = chunk.map((tx) => ({
      id: tx.signature,
      time: Date.now(),
      payload: tx,
    }))

    return this.incomingTransactions.addWork(works)
  }

  protected async handleIncomingTransactions(
    works: PendingWork<T>[],
  ): Promise<number | void> {
    const chunk = works.map((work) => work.payload)

    const now1 = Date.now()
    const release = await this.requestMutex.acquire()
    const now2 = Date.now()

    try {
      const requests = await this.transactionRequestDAL.getAllValues()

      const requestsNonces = []
      let lastFilteredTxs = 0

      let filteredTxs: T[] = []
      let remainingTxs: T[] = chunk
      let requestCount = 0
      const requestCountId = []

      for await (const request of requests) {
        const { nonce, complete } = request
        if (complete) continue

        const result = this.filterIncomingTransactionsByRequest(
          remainingTxs,
          request,
        )

        filteredTxs = filteredTxs.concat(result.filteredTxs)
        remainingTxs = result.remainingTxs
        requestCount++
        requestCountId.push(nonce)

        lastFilteredTxs = filteredTxs.length - lastFilteredTxs
        requestsNonces.push([nonce, lastFilteredTxs])
      }

      console.log(
        `Filtering txs ${filteredTxs.length} of ${chunk.length} by ${requestCount} pending requests`,
      )

      if (filteredTxs.length === 0) return

      const requestResponse =
        filteredTxs as unknown as TransactionRequestResponse<T>[]

      const pendingSignatures =
        filteredTxs as unknown as TransactionRequestPendingSignature[]

      console.log('_____REMOVE FILTERED__', requestsNonces)

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

  protected filterIncomingTransactionsByRequest(
    txs: T[],
    request: TransactionRequest,
  ): {
    filteredTxs: T[]
    remainingTxs: T[]
  } {
    const filteredTxs: T[] = []
    const remainingTxs: T[] = []

    switch (request.type) {
      case TransactionRequestType.BySignatures: {
        const { signatures } = request.params
        const sigSet = new Set(signatures)

        for (const tx of txs) {
          const valid = sigSet.has(tx.signature)

          valid ? filteredTxs.push(tx) : remainingTxs.push(tx)
        }

        break
      }
      default: {
        remainingTxs.push(...txs)
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
      const signaturesStream = await this.fetchTransactionSignatures(
        requestParams,
      )

      if (!signaturesStream)
        throw new Error(
          `Error fetching transactions by ${
            TransactionRequestType[requestParams.type]
          }`,
        )

      const blockchainId = this.blockchainId

      for await (const signatures of signaturesStream) {
        const pendingSignatures = signatures.map((signature) => {
          return { blockchainId, signature, nonces: [nonce] }
        })

        const requestResponse = signatures.map((signature, index) => {
          return { signature, nonceIndexes: { [nonce]: index } }
        })

        await this.transactionRequestResponseDAL.save(requestResponse)
        await this.transactionRequestPendingSignatureDAL.save(pendingSignatures)

        console.log('_____SAVE FILTERED__', nonce, pendingSignatures.length)

        count += signatures.length
      }

      const request = {
        blockchainId,
        nonce,
        complete: !count,
        count,
        ...requestParams,
      }

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

  protected async fetchTransactionSignatures(
    requestParams: TransactionRequestParams,
  ): Promise<void | string[][] | AsyncIterable<string[]>> {
    const { type, params } = requestParams

    switch (type) {
      case TransactionRequestType.BySignatures: {
        await this.fetcherMsClient
          .useBlockchain(this.blockchainId)
          .fetchTransactionsBySignature(params)
        return [params.signatures]
      }
      case TransactionRequestType.ByDateRange: {
        return this.fetcherMsClient
          .useBlockchain(this.blockchainId)
          .fetchAccountTransactionsByDate(params)
      }
      default: {
        return []
      }
    }
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

    let pending = !!(await this.transactionRequestPendingSignatureDAL
      .useIndex(TransactionRequestPendingSignatureDALIndex.NonceSignature)
      .getFirstKeyFromTo([nonce], [nonce], { atomic: true }))

    // @note: Debug false positives completing request when there are pending txs
    if (!pending) {
      console.log('pending enter =>', pending)

      const pendings = await this.transactionRequestPendingSignatureDAL
        .useIndex(TransactionRequestPendingSignatureDALIndex.NonceSignature)
        .getAllFromTo([nonce], [nonce], { atomic: true })

      let pending2 = false
      for await (const item of pendings) {
        pending2 = true
        break
      }

      if (pending !== pending2) {
        pending = pending2
        console.log('👺👺👺 ERROR checkRequestCompletion => ', nonce)
      }
    }

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
        : await this.toRetryBuffer.add(pending)
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

  protected async handleRetryPendingTransactions(
    pendings: TransactionRequestPendingSignature[],
  ): Promise<void> {
    const signatures = pendings.map(({ signature }) => signature)

    console.log(
      `Retrying ${signatures.length} ${this.blockchainId} signatures`,
      pendings,
    )

    return this.fetcherMsClient
      .useBlockchain(this.blockchainId as Blockchain)
      .fetchTransactionsBySignature({ signatures })
  }

  protected async handleRemovePendingTransactions(
    pendings: TransactionRequestPendingSignature[],
  ): Promise<void> {
    console.log(`Removing ${pendings.length} pending signatures`)
    return this.transactionRequestPendingSignatureDAL.remove(pendings)
  }
}
