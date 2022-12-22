import {
  EntityStorage,
  EntityUpdateOp,
  SolanaSignature,
} from '@aleph-indexer/core'
import {
  AccountSignatureDALIndex,
  AccountSignatureStorage,
} from '../../base/dal/accountSignature'

export type SolanaAccountSignatureStorage =
  AccountSignatureStorage<SolanaSignature>

export enum SolanaAccountSignatureDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountSlotIndex = 'account_slot_index',
}

const signatureKey = {
  get: (e: SolanaSignature) => e.signature,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: SolanaSignature) => Object.keys(e.accountSlotIndex),
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
export function createSolanaAccountSignatureDAL(
  path: string,
): SolanaAccountSignatureStorage {
  return new EntityStorage<SolanaSignature>({
    name: 'fetcher_account_signature',
    path,
    key: [signatureKey],
    indexes: [
      {
        name: AccountSignatureDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey],
      },
      {
        name: SolanaAccountSignatureDALIndex.AccountSlotIndex,
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
      }

      return EntityUpdateOp.Update
    },
  })
}
