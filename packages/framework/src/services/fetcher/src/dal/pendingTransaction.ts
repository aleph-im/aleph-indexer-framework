import { PendingWorkStorage } from '@aleph-indexer/core'

export type PendingTransactionStorage = PendingWorkStorage<undefined>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createPendingTransactionDAL(
  path: string,
): PendingTransactionStorage {
  return new PendingWorkStorage({
    name: 'fetcher_pending_transactions',
    path,
    count: true,
  })
}
