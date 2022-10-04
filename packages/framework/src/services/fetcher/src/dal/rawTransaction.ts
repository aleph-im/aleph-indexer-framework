import { EntityStorage, RawTransactionV1 } from '@aleph-indexer/core'

export type RawTransactionStorage = EntityStorage<RawTransactionV1>

const signatureKey = {
  get: (e: RawTransactionV1) => e.transaction.signatures[0],
  length: EntityStorage.VariableLength,
}

/**
 * Creates a new raw transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createRawTransactionDAL(path: string): RawTransactionStorage {
  return new EntityStorage<RawTransactionV1>({
    name: 'fetcher_raw_transactions',
    path,
    key: [signatureKey],
  })
}
