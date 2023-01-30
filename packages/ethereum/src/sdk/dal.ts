import { EntityStorage } from '@aleph-indexer/core'
import { EthereumLogBloom, EthereumSignature } from '../types.js'

// Transaction

export type EthereumAccountTransactionHistoryEntity = EthereumSignature

export type EthereumAccountTransactionHistoryStorage =
  EntityStorage<EthereumSignature>

export enum EthereumAccountTransactionHistoryDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}

// Logs

export type EthereumLogBloomEntity = EthereumLogBloom

export type EthereumLogBloomStorage = EntityStorage<EthereumLogBloom>

export enum EthereumLogBloomDALIndex {
  Timestamp = 'timestamp',
}
