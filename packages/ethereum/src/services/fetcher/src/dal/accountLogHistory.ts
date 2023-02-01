import { EntityStorage } from '@aleph-indexer/core'
import {
  AccountEntityHistoryDALKeys,
  createAccountEntityHistoryDAL,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumAccountLogHistoryStorageEntity } from '../../../../types.js'

export type EthereumAccountLogHistoryEntity =
  EthereumAccountLogHistoryStorageEntity

export type EthereumAccountLogHistoryStorage =
  EntityStorage<EthereumAccountLogHistoryEntity>

export enum EthereumAccountLogHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}

const { accountKey, indexKey } = AccountEntityHistoryDALKeys

const heightKey = {
  get: (e: EthereumAccountLogHistoryEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

/**
 * Creates a new signature storage for the ethereum client.
 * @param path Path to the database.
 */
export function createEthereumAccountLogHistoryDAL(
  path: string,
): EthereumAccountLogHistoryStorage {
  return createAccountEntityHistoryDAL<EthereumAccountLogHistoryEntity>(
    path,
    IndexableEntityType.Log,
    false,
    {
      indexes: [
        {
          name: EthereumAccountLogHistoryDALIndex.AccountHeightIndex,
          key: [accountKey, heightKey, indexKey],
        },
      ],
    },
  )
}
