import {
  EntityStorage,
  EntityUpdateCheckFnReturn,
  EntityUpdateOp,
} from '@aleph-indexer/core'
import {
  AccountEntityHistoryStorage,
  AccountEntityHistoryDALIndex,
} from '@aleph-indexer/framework'

import { SolanaSignature } from '../types.js'

export type SolanaAccountTransactionHistoryStorage =
  AccountEntityHistoryStorage<SolanaSignature>

export enum SolanaAccountTransactionHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountSlotIndex = 'account_slot_index',
}

const signatureKey = {
  get: (e: SolanaSignature) => e.signature,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: SolanaSignature) => e.accounts,
  length: EntityStorage.AddressLength,
}

const timestampKey = {
  get: (e: SolanaSignature) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

const slotKey = {
  get: (e: SolanaSignature) => e.slot,
  // @note: up to (2**64) - 1 [20 digits => MAX_SAFE_INTEGER 16 digits ATM]
  length: 16,
}

const indexKey = {
  get: (e: SolanaSignature, [account]: string[]) => e.accountSlotIndex[account],
  // @note: up to 10**8 [8 digits] (2 digits for iteration + 6 digits index inside iteration
  // this is necessary for keep the signatures sorted when there are different signatures on the same slot
  length: 8,
}

/**
 * Creates a new signature storage for the fetcher.
 * @param path Path to the database.
 */
export function createSolanaAccountTransactionHistoryDAL(
  path: string,
): SolanaAccountTransactionHistoryStorage {
  return new EntityStorage<SolanaSignature>({
    name: 'fetcher_account_transaction_history',
    path,
    key: [signatureKey],
    indexes: [
      {
        name: AccountEntityHistoryDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey],
      },
      {
        name: SolanaAccountTransactionHistoryDALIndex.AccountSlotIndex,
        key: [accountKey, slotKey, indexKey],
      },
    ],
    async updateCheckFn(
      oldEntity: SolanaSignature | undefined,
      newEntity: SolanaSignature,
    ): Promise<EntityUpdateCheckFnReturn<SolanaSignature>> {
      let entity = newEntity

      if (oldEntity) {
        const accountSlotIndex = {
          ...oldEntity.accountSlotIndex,
          ...newEntity.accountSlotIndex,
        }

        entity = {
          ...newEntity,
          accountSlotIndex,
          accounts: Object.keys(accountSlotIndex),
        }
      }

      return { op: EntityUpdateOp.Update, entity }
    },
  })
}
