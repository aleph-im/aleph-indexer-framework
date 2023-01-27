import {
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'
import { ParsedTransaction } from '../../../../types.js'

export type TransactionRequestIncomingTransactionStorage<
  T extends ParsedTransaction<unknown>,
> = PendingWorkStorage<T>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 */
export function createTransactionRequestIncomingTransactionDAL<
  T extends ParsedTransaction<unknown>,
>(path: string): TransactionRequestIncomingTransactionStorage<T> {
  return new PendingWorkStorage({
    name: 'transaction_request_incoming_transaction',
    path,
    count: true,
    async updateCheckFn(
      oldEntity: PendingWork<T> | undefined,
      newEntity: PendingWork<T>,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        newEntity.time = oldEntity.time
      }

      return EntityUpdateOp.Update
    },
  })
}
