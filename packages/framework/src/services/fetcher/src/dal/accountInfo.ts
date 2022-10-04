import {
  EntityStorage,
  AccountInfo,
  AccountInfoStorage,
} from '@aleph-indexer/core'

const accountKey = {
  get: (e: AccountInfo) => e.address,
  length: EntityStorage.AddressLength,
}

/**
 * Creates a new account info storage for the fetcher.
 * @param path Path to the database.
 */
export function createAccountInfoDAL(path: string): AccountInfoStorage {
  return new EntityStorage<AccountInfo>({
    name: 'fetcher_accounts_info',
    path,
    key: [accountKey],
  })
}
