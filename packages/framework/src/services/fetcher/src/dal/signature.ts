import { EntityStorage, EntityUpdateOp, Signature } from '@aleph-indexer/core'

export type SignatureStorage = EntityStorage<Signature>

export enum SignatureDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountSlotIndex = 'account_slot_index',
}

const signatureKey = {
  get: (e: Signature) => e.signature,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: Signature) => Object.keys(e.accountSlotIndex),
  length: EntityStorage.AddressLength,
}

const timestampKey = {
  get: (e: Signature) => (e.blockTime || 0) * 1000,
  length: EntityStorage.TimestampLength,
}

const slotKey = {
  get: (e: Signature) => e.slot,
  // @note: up to (2**64) - 1 [20 digits => MAX_SAFE_INTEGER 16 digits ATM]
  length: 16,
}

const indexKey = {
  get: (e: Signature, [account]: string[]) => e.accountSlotIndex[account],
  // @note: up to 10**8 [8 digits] (2 digits for iteration + 6 digits index inside iteration
  // this is necessary for keep the signatures sorted when there are different signatures on the same slot
  length: 8,
}

/**
 * Creates a new signature storage for the fetcher.
 * @param path Path to the database.
 */
export function createSignatureDAL(path: string): SignatureStorage {
  return new EntityStorage<Signature>({
    name: 'fetcher_signatures',
    path,
    primaryKey: [signatureKey],
    indexes: [
      {
        name: SignatureDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey], // signature?
      },
      {
        name: SignatureDALIndex.AccountSlotIndex,
        key: [accountKey, slotKey, indexKey], // signature?
      },
    ],
    async updateCheckFn(
      oldEntity: Signature | undefined,
      newEntity: Signature,
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
