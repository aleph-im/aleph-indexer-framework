import { ParsedTransactionV1, PendingWorkStorage } from '@aleph-indexer/core'

export type TransactionRequestIncomingTransactionStorage =
  PendingWorkStorage<ParsedTransactionV1>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createTransactionRequestIncomingTransactionDAL(
  path: string,
): TransactionRequestIncomingTransactionStorage {
  return new PendingWorkStorage({
    name: 'transaction_request_incoming_transaction',
    path,
    count: true,
  })
}
