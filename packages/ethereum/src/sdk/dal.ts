import { EntityStorage } from '@aleph-indexer/core'
import { EthereumSignature } from '../types.js'

export type EthereumAccountTransactionHistoryEntity = EthereumSignature

export type EthereumAccountTransactionHistoryStorage =
  EntityStorage<EthereumSignature>

export enum EthereumAccountTransactionHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}
