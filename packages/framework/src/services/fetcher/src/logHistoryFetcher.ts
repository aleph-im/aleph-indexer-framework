import { FetcherMsClient } from '../client.js'
import { PendingAccountStorage } from './dal/account.js'
import { Blockchain } from '../../../types.js'
import { BaseEntityHistoryFetcher } from './entityHistoryFetcher.js'
import {
  AccountEntityHistoryFetcherState,
  FetchAccountEntitiesByDateRequestArgs,
} from './types.js'
import {
  AccountLogHistoryStorage,
  AccountLogHistoryStorageEntity,
} from './dal/accountLogHistory.js'

export abstract class BaseLogHistoryFetcher<
  C,
  E extends AccountLogHistoryStorageEntity,
> extends BaseEntityHistoryFetcher<C, E> {
  constructor(
    protected blockchainId: Blockchain,
    protected fetcherClient: FetcherMsClient,
    protected accountSignatureDAL: AccountLogHistoryStorage<E>,
    protected accountDAL: PendingAccountStorage,
  ) {
    super(
      blockchainId,
      fetcherClient,
      accountSignatureDAL,
      accountDAL,
      `${blockchainId}:log-history-accounts`,
    )
  }

  async fetchAccountLogsByDate(
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
