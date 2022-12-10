import { EntityStorage, EntityUpdateOp } from '../../storage/index.js'

export type EthereumSignatureEntity = {
  signature: string
  height: number
  timestamp: number
  index: number
  accounts: string[]
}

export type EthereumSignatureStorage = EntityStorage<EthereumSignatureEntity>

export enum EthereumSignatureDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}

const signatureKey = {
  get: (e: EthereumSignatureEntity) => e.signature,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: EthereumSignatureEntity) => Object.values(e.accounts),
  length: EntityStorage.EthereumAddressLength,
}

const timestampKey = {
  get: (e: EthereumSignatureEntity) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumSignatureEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

const indexKey = {
  get: (e: EthereumSignatureEntity) => e.index,
  // @note: up to 999 txs per block
  length: 3,
}

/**
 * Creates a new signature storage for the ethereum client.
 * @param path Path to the database.
 */
export function createEthereumSignatureDAL(
  path: string,
): EthereumSignatureStorage {
  return new EntityStorage<EthereumSignatureEntity>({
    name: 'ethereum_client_signatures',
    path,
    key: [signatureKey],
    indexes: [
      {
        name: EthereumSignatureDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey],
      },
      {
        name: EthereumSignatureDALIndex.AccountHeightIndex,
        key: [accountKey, heightKey, indexKey],
      },
    ],

    async updateCheckFn(
      oldEntity: EthereumSignatureEntity | undefined,
      newEntity: EthereumSignatureEntity,
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
