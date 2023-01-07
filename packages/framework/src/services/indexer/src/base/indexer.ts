import { Blockchain, SolanaParsedTransactionV1 } from '@aleph-indexer/core'
import { FetcherMsClient } from '../../../fetcher/client.js'
import { ParserMsClient } from '../../../parser/client.js'
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
import { AccountTransactionIndexer } from './accountTransactionIndexer.js'
import { BlockchainIndexerI } from './types.js'
import { IndexerMsClient } from '../../client.js'
import { TransactionFetcher } from './transactionFetcher.js'

/**
 * Main class of the indexer service. Creates and manages all indexers.
 */
export class BaseIndexer implements BlockchainIndexerI {
  protected accountTransactionsIndexers: Record<
    string,
    AccountTransactionIndexer
  > = {}
  protected txsHandler: (chunk: SolanaParsedTransactionV1[]) => Promise<void>

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
    protected transactionFetcher: TransactionFetcher,
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

    this.parserClient.on(`txs.${this.blockchainId}`, this.txsHandler)
    await this.transactionFetcher.start().catch(() => 'ignore')
  }

  async stop(): Promise<void> {
    this.parserClient.off(`txs.${this.blockchainId}`, this.txsHandler)
    await this.transactionFetcher.stop().catch(() => 'ignore')
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
        blockchainId,
        account,
        ...(typeof content !== 'boolean'
          ? content
          : { snapshotDelay: 1000 * 60 * 60 }),
      })
    }

    await this.domain.onNewAccount(args)
  }

  async deleteAccount(args: AccountIndexerRequestArgs): Promise<void> {
    const { transactions, content } = args.index

    if (transactions) {
      const accountIndexer = this.accountTransactionsIndexers[args.account]
      if (!accountIndexer) return
      await accountIndexer.stop()
    }

    if (content) {
      // @todo
    }
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

    state.indexer = this.indexerClient.getNodeId()
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
   * @param args The indexer configuration.
   * @protected
   */
  protected async indexAccountTransactions(
    args: AccountIndexerTransactionRequestArgs,
  ): Promise<void> {
    let accountIndexer = this.accountTransactionsIndexers[args.account]
    if (accountIndexer) return

    accountIndexer = new AccountTransactionIndexer(
      args,
      this.domain,
      this.fetcherClient,
      this.transactionFetcher,
      this.transactionIndexerStateDAL,
    )

    await accountIndexer.start()

    this.accountTransactionsIndexers[args.account] = accountIndexer
  }

  /**
   * Creates a new account content indexer. [Not implemented]
   * @param args The indexer configuration.
   * @protected
   */
  protected async indexAccountContent(
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
