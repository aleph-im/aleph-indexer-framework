import {
  EntityStorage,
  AccountState,
  AccountStateStorage,
} from '@aleph-indexer/core'

const accountKey = {
  get: (e: AccountState) => e.account.toLowerCase(),
  length: EntityStorage.AddressLength,
}

/**
 * Creates a new account info storage for the fetcher.
 * @param path Path to the database.
 */
export function createAccountStateDAL<T extends AccountState>(
  path: string,
): AccountStateStorage<T> {
  return new EntityStorage<T>({
    name: 'fetcher_account_state',
    path,
    key: [accountKey],
  })
}
