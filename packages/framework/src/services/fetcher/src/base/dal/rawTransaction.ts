import { EntityStorage, RawTransaction } from '@aleph-indexer/core'

export type RawTransactionStorage<T extends RawTransaction> = EntityStorage<T>

const signatureKey = {
  get: <T extends RawTransaction>(e: T) => e.signature,
  length: EntityStorage.VariableLength,
}

/**
 * Creates a new raw transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createRawTransactionDAL<T extends RawTransaction>(
  path: string,
): RawTransactionStorage<T> {
  return new EntityStorage<T>({
    name: 'fetcher_raw_transaction',
    path,
    key: [signatureKey],
  })
}
