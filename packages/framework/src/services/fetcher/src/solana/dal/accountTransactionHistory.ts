import { EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'
import {
  AccountTransactionHistoryDALIndex,
  AccountTransactionHistoryStorage,
} from '../../base/dal/accountTransactionHistory.js'
import { SolanaSignature } from '../types.js'

export type SolanaAccountTransactionHistoryStorage =
  AccountTransactionHistoryStorage<SolanaSignature>

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
  get: (e: SolanaSignature) => (e.blockTime || 0) * 1000,
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
        name: AccountTransactionHistoryDALIndex.AccountTimestampIndex,
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
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        newEntity.accountSlotIndex = {
          ...oldEntity.accountSlotIndex,
          ...newEntity.accountSlotIndex,
        }

        newEntity.accounts = Object.keys(newEntity.accountSlotIndex)
      }

      return EntityUpdateOp.Update
    },
  })
}
