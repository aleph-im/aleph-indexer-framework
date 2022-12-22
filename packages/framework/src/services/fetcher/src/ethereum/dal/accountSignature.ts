import {
  EthereumAccountSignatureEntity,
  EthereumAccountSignatureStorage,
  EthereumAccountSignatureDALIndex,
  EntityStorage,
  EntityUpdateOp,
} from '@aleph-indexer/core'
import { AccountSignatureDALIndex } from '../../base/dal/accountSignature.js'

export {
  EthereumAccountSignatureEntity,
  EthereumAccountSignatureStorage,
  EthereumAccountSignatureDALIndex,
} from '@aleph-indexer/core'

const signatureKey = {
  get: (e: EthereumAccountSignatureEntity) => e.signature,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: EthereumAccountSignatureEntity) => Object.values(e.accounts),
  length: EntityStorage.EthereumAddressLength,
}

const timestampKey = {
  get: (e: EthereumAccountSignatureEntity) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumAccountSignatureEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

const indexKey = {
  get: (e: EthereumAccountSignatureEntity) => e.index,
  // @note: up to 999 txs per block
  length: 3,
}

/**
 * Creates a new signature storage for the ethereum client.
 * @param path Path to the database.
 */
export function createEthereumAccountSignatureDAL(
  path: string,
): EthereumAccountSignatureStorage {
  return new EntityStorage<EthereumAccountSignatureEntity>({
    name: 'fetcher_account_signature',
    path,
    key: [signatureKey],
    indexes: [
      {
        name: AccountSignatureDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey],
      },
      {
        name: EthereumAccountSignatureDALIndex.AccountHeightIndex,
        key: [accountKey, heightKey, indexKey],
      },
    ],

    async updateCheckFn(
      oldEntity: EthereumAccountSignatureEntity | undefined,
      newEntity: EthereumAccountSignatureEntity,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        const accounts = new Set([
          ...(oldEntity.accounts || []),
          ...(newEntity.accounts || []),
        ])
        newEntity.accounts = [...accounts]
      }

      return EntityUpdateOp.Update
    },
  })
}
