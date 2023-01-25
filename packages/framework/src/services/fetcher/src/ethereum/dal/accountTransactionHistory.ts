import { EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'
import {
  EthereumAccountTransactionHistoryDALIndex,
  EthereumAccountTransactionHistoryEntity,
  EthereumAccountTransactionHistoryStorage,
} from '../../../../../rpc/ethereum/dal.js'
import { AccountTransactionHistoryDALIndex } from '../../base/dal/accountTransactionHistory.js'

const signatureKey = {
  get: (e: EthereumAccountTransactionHistoryEntity) =>
    e.signature.toLowerCase(),
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: EthereumAccountTransactionHistoryEntity) =>
    e.accounts.map((acc) => acc.toLowerCase()),
  length: EntityStorage.EthereumAddressLength,
}

const timestampKey = {
  get: (e: EthereumAccountTransactionHistoryEntity) => e.timestamp * 1000,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumAccountTransactionHistoryEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

const indexKey = {
  get: (e: EthereumAccountTransactionHistoryEntity) => e.index,
  // @note: up to 999 txs per block
  length: 3,
}

/**
 * Creates a new signature storage for the ethereum client.
 * @param path Path to the database.
 */
export function createEthereumAccountTransactionHistoryDAL(
  path: string,
): EthereumAccountTransactionHistoryStorage {
  return new EntityStorage<EthereumAccountTransactionHistoryEntity>({
    name: 'fetcher_account_transaction_history',
    path,
    key: [signatureKey],
    indexes: [
      {
        name: AccountTransactionHistoryDALIndex.AccountTimestampIndex,
        key: [accountKey, timestampKey, indexKey],
      },
      {
        name: EthereumAccountTransactionHistoryDALIndex.AccountHeightIndex,
        key: [accountKey, heightKey, indexKey],
      },
    ],

    async updateCheckFn(
      oldEntity: EthereumAccountTransactionHistoryEntity | undefined,
      newEntity: EthereumAccountTransactionHistoryEntity,
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
