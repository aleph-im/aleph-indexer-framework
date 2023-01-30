import { EntityStorage } from '@aleph-indexer/core'
import { AccountMint } from '../domain/types.js'

export type AccountMintStorage = EntityStorage<AccountMint>

const mintKey = {
  get: (e: AccountMint) => e.mint,
  length: EntityStorage.AddressLength,
}

const accountKey = {
  get: (e: AccountMint) => e.account,
  length: EntityStorage.AddressLength,
}

export function createAccountMintDAL(path: string): AccountMintStorage {
  return new EntityStorage<AccountMint>({
    name: 'account_mint',
    path,
    key: [mintKey, accountKey],
  })
}
