import { EntityStorage } from '@aleph-indexer/core'
import {
  AccountEntityHistoryDALKeys,
  createAccountEntityHistoryDAL,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumAccountTransactionHistoryStorageEntity } from '../../../../../types.js'

export type EthereumAccountTransactionHistoryEntity =
  EthereumAccountTransactionHistoryStorageEntity

export type EthereumAccountTransactionHistoryStorage =
  EntityStorage<EthereumAccountTransactionHistoryStorageEntity>

export enum EthereumAccountTransactionHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}
const { accountKey, indexKey } = AccountEntityHistoryDALKeys

const heightKey = {
  get: (e: EthereumAccountTransactionHistoryEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

/**
 * Creates a new signature storage for the ethereum client.
 * @param path Path to the database.
 */
export function createEthereumAccountTransactionHistoryDAL(
  path: string,
): EthereumAccountTransactionHistoryStorage {
  return createAccountEntityHistoryDAL<EthereumAccountTransactionHistoryEntity>(
    path,
    IndexableEntityType.Transaction,
    false,
    {
      indexes: [
        {
          name: EthereumAccountTransactionHistoryDALIndex.AccountHeightIndex,
          key: [accountKey, heightKey, indexKey],
        },
      ],
    },
  )
}
