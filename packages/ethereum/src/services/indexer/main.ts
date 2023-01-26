import {
  AccountIndexerRequestArgs,
  AccountIndexerState,
  AccountIndexerStateRequestArgs,
  AccountIndexerTransactionRequestArgs,
  BaseIndexer,
  Blockchain,
  BlockchainIndexerI,
  FetcherMsClient,
  GetAccountIndexingStateRequestArgs,
  IndexerMsClient,
  IndexerWorkerDomainI,
  InvokeMethodRequestArgs,
  ParserMsClient,
  TransactionIndexerStateStorage,
} from '@aleph-indexer/framework'
import { EthereumParsedTransaction } from '../parser/src/types.js'
import { EthereumIndexerTransactionFetcher } from './src/transactionFetcher.js'

export class EthereumIndexer
  extends BaseIndexer<EthereumParsedTransaction>
  implements BlockchainIndexerI
{
  constructor(
    protected domain: IndexerWorkerDomainI,
    protected indexerClient: IndexerMsClient,
    protected fetcherClient: FetcherMsClient,
    protected parserClient: ParserMsClient,
    protected transactionIndexerStateDAL: TransactionIndexerStateStorage,
    protected transactionFetcher: EthereumIndexerTransactionFetcher,
  ) {
    super(
      Blockchain.Ethereum,
      domain,
      indexerClient,
      fetcherClient,
      parserClient,
      transactionIndexerStateDAL,
      transactionFetcher,
    )
  }

  async indexAccount(args: AccountIndexerRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.indexAccount(args)
  }

  async deleteAccount(args: AccountIndexerRequestArgs): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.deleteAccount(args)
  }

  async getAccountState(
    args: GetAccountIndexingStateRequestArgs,
  ): Promise<AccountIndexerState | undefined> {
    args.account = args.account.toLowerCase()
    return super.getAccountState(args)
  }

  async invokeDomainMethod(args: InvokeMethodRequestArgs): Promise<unknown> {
    args.account = args.account.toLowerCase()
    return super.invokeDomainMethod(args)
  }

  protected async indexAccountTransactions(
    args: AccountIndexerTransactionRequestArgs,
  ): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.indexAccountTransactions(args)
  }

  protected async indexAccountContent(
    args: AccountIndexerStateRequestArgs,
  ): Promise<void> {
    args.account = args.account.toLowerCase()
    return super.indexAccountContent(args)
  }
}
