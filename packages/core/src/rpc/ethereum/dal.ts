import { EntityStorage } from '../../storage/index.js'
import { EthereumSignature } from '../../types/ethereum.js'

export type EthereumAccountTransactionHistoryEntity = EthereumSignature

export type EthereumAccountTransactionHistoryStorage =
  EntityStorage<EthereumSignature>

export enum EthereumAccountTransactionHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}
