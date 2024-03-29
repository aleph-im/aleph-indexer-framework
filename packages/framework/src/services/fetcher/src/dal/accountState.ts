import { EntityStorage } from '@aleph-indexer/core'

export type AccountState = { account: string }
export type AccountStateStorage<T extends AccountState> = EntityStorage<T>

const accountCaseSensitiveKey = {
  get: (e: AccountState) => e.account,
  length: EntityStorage.AddressLength,
}

const accountKey = {
  ...accountCaseSensitiveKey,
  get: (e: AccountState) => e.account.toLowerCase(),
}

/**
 * Creates a new account info storage for the fetcher.
 * @param path Path to the database.
 */
export function createAccountStateDAL<T extends AccountState>(
  path: string,
  caseSensitive = true,
): AccountStateStorage<T> {
  return new EntityStorage<T>({
    name: 'fetcher_account_state',
    path,
    key: [caseSensitive ? accountCaseSensitiveKey : accountKey],
  })
}
