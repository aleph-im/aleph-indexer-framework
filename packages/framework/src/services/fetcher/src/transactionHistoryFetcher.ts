import { FetcherMsClient } from '../client.js'
import { PendingAccountStorage } from './dal/account.js'
import {
  AccountTransactionHistoryStorage,
  AccountTransactionHistoryStorageEntity,
} from './dal/accountTransactionHistory.js'
import { Blockchain } from '../../../types.js'
import { BaseEntityHistoryFetcher } from './entityHistoryFetcher.js'
import {
  AccountEntityHistoryFetcherState,
  FetchAccountEntitiesByDateRequestArgs,
} from './types.js'

export abstract class BaseTransactionHistoryFetcher<
  C,
  E extends AccountTransactionHistoryStorageEntity,
> extends BaseEntityHistoryFetcher<C, E> {
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherClient: FetcherMsClient,
    protected accountSignatureDAL: AccountTransactionHistoryStorage<E>,
    protected accountDAL: PendingAccountStorage,
  ) {
    super(
      blockchainId,
      fetcherClient,
      accountSignatureDAL,
      accountDAL,
      `${blockchainId}:transaction-history-accounts`,
    )
  }

  async fetchAccountTransactionsByDate(
    args: FetchAccountEntitiesByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    return super.fetchAccountEntitiesByDate(args)
  }

  async getState(): Promise<AccountEntityHistoryFetcherState> {
    return super.getPartialState()
  }

  protected getEntityId(entity: E): string {
    return entity.signature
  }
}
