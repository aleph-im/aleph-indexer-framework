import {
  EntityUpdateOp,
  PendingWork,
  PendingWorkStorage,
} from '@aleph-indexer/core'
import { MintAccount } from '../domain/types.js'

export type FetchMintStorage = PendingWorkStorage<MintAccount>

/**
 * Creates a new pending transaction storage for the fetcher.
 * @param path Path to the database.
 * @param name Name of the storage file
 */
export function createFetchMintDAL(
  path: string,
  name = 'fetcher_mint_accounts',
): FetchMintStorage {
  return new PendingWorkStorage<MintAccount>({
    name,
    path,
    count: true,
    async updateCheckFn(
      oldEntity: PendingWork<MintAccount> | undefined,
      newEntity: PendingWork<MintAccount>,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        if (oldEntity.payload.timestamp > newEntity.payload.timestamp) {
          newEntity.payload = oldEntity.payload
        }
      }

      return EntityUpdateOp.Update
    },
  })
}
