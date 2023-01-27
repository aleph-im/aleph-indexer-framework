import { FetcherMsClient } from '../../fetcher/client.js'
import { ParserMsClient } from '../../parser/client.js'
import { TransactionIndexerStateStorage } from './dal/transactionIndexerState.js'
import { TransactionRequest } from './dal/transactionRequest.js'
import {
  AccountIndexerState,
  AccountIndexerRequestArgs,
  IndexerWorkerDomainI,
  AccountIndexerTransactionRequestArgs,
  AccountIndexerStateRequestArgs,
  GetAccountIndexingStateRequestArgs,
  InvokeMethodRequestArgs,
  GetTransactionPendingRequestsRequestArgs,
} from './types.js'
import { BaseAccountTransactionIndexer } from './accountTransactionIndexer.js'
import { BlockchainIndexerI } from './types.js'
import { IndexerMsClient } from '../client.js'
import { BaseIndexerTransactionFetcher } from './transactionFetcher.js'
import { Blockchain, ParsedTransaction } from '../../../types.js'

/**
 * Main class of the indexer service. Creates and manages all indexers.
 */
export abstract class BaseIndexer<T extends ParsedTransaction<unknown>>
  implements BlockchainIndexerI
{
  protected accountTransactionsIndexers: Record<
    string,
    BaseAccountTransactionIndexer<T>
  > = {}

  protected txsHandler: (chunk: T[]) => Promise<void>

  /**
   * @param blockchainId The blockchain identifier.
   * @param domain The customized domain user class.
   * @param indexerClient Allows communication with the sibling indexer instances.
   * @param fetcherClient Allows communication with the fetcher service.
   * @param parserClient Allows communication with the parser service.
   * @param transactionIndexerStateDAL Stores the transaction indexer state.
   * @param transactionFetcher Fetches actual transaction data by their signatures.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected domain: IndexerWorkerDomainI,
    protected indexerClient: IndexerMsClient,
    protected fetcherClient: FetcherMsClient,
    protected parserClient: ParserMsClient,
    protected transactionIndexerStateDAL: TransactionIndexerStateStorage,
    protected transactionFetcher: BaseIndexerTransactionFetcher<T>,
  ) {
    this.txsHandler = this.onTxs.bind(this)
  }

  /**
   * Waits for the fetchers and parsers to be ready.
   * Registers the onTxs event on the parser,
   * such that it can parse ixns from the txns.
   */
  async start(): Promise<void> {
    await this.fetcherClient.waitForService()
    await this.parserClient.waitForService()

    this.parserClient.on(`parser.txs.${this.blockchainId}`, this.txsHandler)
    await this.transactionFetcher.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    this.parserClient.off(`parser.txs.${this.blockchainId}`, this.txsHandler)
    await this.transactionFetcher.stop().catch(() => 'ignore')
  }

  // async fetchTransactions(dateRange: AccountEventsFilters): Promise<void> {
  //   const { account } = dateRange

  //   const accountIndexer = this.accountTransactionsIndexers[account]
  //   if (!accountIndexer) throw new Error(`Account not indexed ${account}`)

  //   // return accountIndexer.fetchTransactions(dateRange)
  // }

  async indexAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const { account, blockchainId, index } = args
    const { transactions, state } = index

    if (transactions) {
      await this.indexAccountTransactions({
        blockchainId,
        account,
        ...(typeof transactions !== 'boolean'
          ? transactions
          : { chunkDelay: 0, chunkTimeframe: 1000 * 60 * 60 * 24 }),
      })
    }

    if (state) {
      await this.indexAccountState({
        blockchainId,
        account,
        ...(typeof state !== 'boolean'
          ? state
          : { snapshotDelay: 1000 * 60 * 60 }),
      })
    }

    await this.domain.onNewAccount(args)
  }

  async deleteAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const { account } = args
    const { transactions, state } = args.index

    if (transactions) {
      const accountIndexer = this.accountTransactionsIndexers[account]
      if (!accountIndexer) return
      await accountIndexer.stop()
    }

    if (state) {
      // @todo
    }
  }

  async getAccountState(
    args: GetAccountIndexingStateRequestArgs,
  ): Promise<AccountIndexerState | undefined> {
    const { account } = args

    const indexer = this.accountTransactionsIndexers[account]
    if (!indexer) return

    const state: any = await indexer.getIndexingState()
    if (!state) return

    state.indexer = this.indexerClient.getNodeId()
    return state
  }

  async invokeDomainMethod(argss: InvokeMethodRequestArgs): Promise<unknown> {
    const { account, method, args = [] } = argss

    const fn = (this.domain as any)[method]

    if (!fn)
      throw new Error(`Method ${method} does not exists in indexer domain`)

    return fn.call(this.domain, account, ...args)
  }

  protected async onTxs(chunk: T[]): Promise<void> {
    console.log(`💌 ${chunk.length} txs received by the indexer...`)
    await this.transactionFetcher.onTxs(chunk)
  }

  /**
   * Creates a new account transaction indexer.
   * It will fetch and parse transactions automatically,
   * while keeping track of the indexing state and may be restarted at any time.
   * @param args The indexer configuration.
   * @protected
   */
  protected async indexAccountTransactions(
    args: AccountIndexerTransactionRequestArgs,
  ): Promise<void> {
    const { account } = args

    let accountIndexer = this.accountTransactionsIndexers[account]
    if (accountIndexer) return

    accountIndexer = new BaseAccountTransactionIndexer<T>(
      args,
      this.domain,
      this.fetcherClient,
      this.transactionFetcher,
      this.transactionIndexerStateDAL,
    )

    await accountIndexer.start()

    this.accountTransactionsIndexers[account] = accountIndexer
  }

  /**
   * Creates a new account content indexer. [Not implemented]
   * @param args The indexer configuration.
   * @protected
   */
  protected async indexAccountState(
    args: AccountIndexerStateRequestArgs,
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

  protected mapWithIndexerId<T>(items: T[]): T[] {
    const indexer = this.indexerClient.getNodeId()
    return items.map((item) => {
      ;(item as any).indexer = indexer
      return item
    })
  }
}
