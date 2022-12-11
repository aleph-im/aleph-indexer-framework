import { SolanaParsedTransactionV1 } from '@aleph-indexer/core'
import { ServiceBroker } from 'moleculer'
import { getRegistryNodesWithService, MsIds } from '../common.js'
import { FetcherMsClient } from '../fetcher/client.js'
import { ParserMsClient } from '../parser/client.js'
import { IndexerMsI, PrivateIndexerMsI } from './interface.js'
import { TransactionIndexerStateStorage } from './src/dal/transactionIndexerState.js'
import {
  TransactionRequest,
  TransactionRequestStorage,
} from './src/dal/transactionRequest.js'
import { TransactionRequestIncomingTransactionStorage } from './src/dal/transactionRequestIncomingTransaction.js'
import { TransactionRequestPendingSignatureStorage } from './src/dal/transactionRequestPendingSignature.js'
import { TransactionRequestResponseStorage } from './src/dal/transactionRequestResponse.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  IndexerWorkerDomainI,
  AccountTransactionsIndexerArgs,
  AccountContentIndexerArgs,
  GetAccountIndexingStateRequestArgs,
  InvokeMethodRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './src/types.js'
import { AccountTransactionIndexer } from './src/utils/accountTransactionIndexer.js'
import { TransactionFetcher } from './src/utils/transactionFetcher.js'

/**
 * Main class of the indexer service. Creates and manages all indexers.
 */
export class IndexerMsMain implements IndexerMsI, PrivateIndexerMsI {
  protected domain!: IndexerWorkerDomainI
  protected accountTransactionsIndexers: Record<
    string,
    AccountTransactionIndexer
  > = {}
  protected txsHandler: (chunk: SolanaParsedTransactionV1[]) => Promise<void>

  /**
   * @param fetcherMsClient Allows communication with the fetcher service.
   * @param parserMsClient Allows communication with the parser service.
   * @param transactionRequestDAL Stores the transaction requests.
   * @param transactionRequestPendingSignatureDAL Stores pending signatures for transaction requests.
   * @param transactionRequestResponseDAL Stores the transaction request responses.
   * @param transactionIndexerStateDAL Stores the transaction indexer state.
   * @param transactionFetcher Fetches actual transaction data by their signatures.
   */
  constructor(
    protected broker: ServiceBroker,
    protected fetcherMsClient: FetcherMsClient,
    protected parserMsClient: ParserMsClient,
    protected transactionRequestDAL: TransactionRequestStorage,
    protected transactionRequestIncomingTransactionDAL: TransactionRequestIncomingTransactionStorage,
    protected transactionRequestPendingSignatureDAL: TransactionRequestPendingSignatureStorage,
    protected transactionRequestResponseDAL: TransactionRequestResponseStorage,
    protected transactionIndexerStateDAL: TransactionIndexerStateStorage,
    protected transactionFetcher: TransactionFetcher = new TransactionFetcher(
      fetcherMsClient,
      transactionRequestDAL,
      transactionRequestIncomingTransactionDAL,
      transactionRequestPendingSignatureDAL,
      transactionRequestResponseDAL,
    ),
  ) {
    this.txsHandler = this.onTxs.bind(this)
  }

  /**
   * Waits for the fetchers and parsers to be ready.
   * Registers the onTxs event on the parser,
   * such that it can parse ixns from the txns.
   */
  async start(): Promise<void> {
    await this.fetcherMsClient.waitForService()
    await this.parserMsClient.waitForService()

    this.parserMsClient.on('txs', this.txsHandler)
    await this.transactionFetcher.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    this.parserMsClient.off('txs', this.txsHandler)
    await this.transactionFetcher.stop().catch(() => 'ignore')
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  getAllIndexers(): string[] {
    return getRegistryNodesWithService(this.broker, MsIds.Indexer)
  }

  // async fetchTransactions(dateRange: AccountEventsFilters): Promise<void> {
  //   const { account } = dateRange

  //   const accountIndexer = this.accountTransactionsIndexers[account]
  //   if (!accountIndexer) throw new Error(`Account not indexed ${account}`)

  //   // return accountIndexer.fetchTransactions(dateRange)
  // }

  async indexAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const { blockchainId, account, index } = args
    const { transactions, content } = index

    if (transactions) {
      await this.indexAccountTransactions({
        blockchainId,
        account,
        ...(typeof transactions !== 'boolean'
          ? transactions
          : { chunkDelay: 0, chunkTimeframe: 1000 * 60 * 60 * 24 }),
      })
    }

    if (content) {
      await this.indexAccountContent({
        account,
        ...(typeof content !== 'boolean'
          ? content
          : { snapshotDelay: 1000 * 60 * 60 }),
      })
    }

    await this.domain.onNewAccount(args)
  }

  async getAccountState({
    account,
  }: GetAccountIndexingStateRequestArgs): Promise<
    AccountIndexerState | undefined
  > {
    const indexer = this.accountTransactionsIndexers[account]
    if (!indexer) return

    const state: any = await indexer.getIndexingState()
    if (!state) return

    state.indexer = this.getIndexerId()
    return state
  }

  async invokeDomainMethod({
    account,
    method,
    args = [],
  }: InvokeMethodRequestArgs): Promise<unknown> {
    const fn = (this.domain as any)[method]

    if (!fn)
      throw new Error(`Method ${method} does not exists in indexer domain`)

    return fn.call(this.domain, account, ...args)
  }

  protected async onTxs(chunk: SolanaParsedTransactionV1[]): Promise<void> {
    // console.log(`💌 ${chunk.length} txs received by the indexer...`)
    await this.transactionFetcher.onTxs(chunk)
  }

  /**
   * Creates a new account transaction indexer.
   * It will fetch and parse transactions automatically,
   * while keeping track of the indexing state and may be restarted at any time.
   * @param config The indexer configuration.
   * @protected
   */
  protected async indexAccountTransactions(
    args: AccountTransactionsIndexerArgs,
  ): Promise<void> {
    let accountIndexer = this.accountTransactionsIndexers[args.account]
    if (accountIndexer) return

    accountIndexer = new AccountTransactionIndexer(
      args,
      this.domain,
      this.fetcherMsClient,
      this.transactionFetcher,
      this.transactionIndexerStateDAL,
    )

    await accountIndexer.start()

    this.accountTransactionsIndexers[args.account] = accountIndexer
  }

  /**
   * Creates a new account content indexer. [Not implemented]
   * @param config The indexer configuration.
   * @protected
   */
  protected async indexAccountContent(
    args: AccountContentIndexerArgs,
  ): Promise<void> {
    // @todo
  }

  // Private API

  async getTransactionRequests(
    filters: GetTransactionPendingRequestsRequestArgs,
  ): Promise<TransactionRequest[]> {
    const requests = await this.transactionFetcher.getRequests(filters)
    return this.mapWithIndexerId(requests)
  }

  // @todo: Make the Main class moleculer-agnostic by DI
  protected getIndexerId(): string {
    return this.broker.nodeID
  }

  protected mapWithIndexerId<T>(items: T[]): T[] {
    const indexer = this.getIndexerId()
    return items.map((item) => {
      ;(item as any).indexer = indexer
      return item
    })
  }
}
