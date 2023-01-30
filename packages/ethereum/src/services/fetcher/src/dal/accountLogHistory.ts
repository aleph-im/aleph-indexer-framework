import { EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'
import { AccountEntityHistoryDALIndex } from '@aleph-indexer/framework'
import { EthereumRawLog } from '../../../../types.js'

export type EthereumAccountLogHistoryEntity = EthereumRawLog

export type EthereumAccountLogHistoryStorage = EntityStorage<EthereumRawLog>

export enum EthereumAccountLogHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}

const accountKey = {
  get: (e: EthereumAccountLogHistoryEntity) =>
    e.accounts.map((acc) => acc.toLowerCase()),
  length: EntityStorage.EthereumAddressLength,
}

const timestampKey = {
  get: (e: EthereumAccountLogHistoryEntity) => e.timestamp * 1000,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumAccountLogHistoryEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

const indexKey = {
  get: (e: EthereumAccountLogHistoryEntity) => e.logIndex,
  // @note: up to 999 txs per block
  length: 3,
}

/**
 * Creates a new signature storage for the ethereum client.
 * @param path Path to the database.
 */
export function createEthereumAccountLogHistoryDAL(
  path: string,
): EthereumAccountLogHistoryStorage {
  return new EntityStorage<EthereumAccountLogHistoryEntity>({
    name: 'fetcher_account_transaction_history',
    path,
    key: [heightKey, indexKey],
    indexes: [
      {
        name: AccountEntityHistoryDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey],
      },
      {
        name: EthereumAccountLogHistoryDALIndex.AccountHeightIndex,
        key: [accountKey, heightKey, indexKey],
      },
    ],

    async updateCheckFn(
      oldEntity: EthereumAccountLogHistoryEntity | undefined,
      newEntity: EthereumAccountLogHistoryEntity,
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
