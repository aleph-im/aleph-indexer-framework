import { EntityStorage } from '../../storage/index.js'
import { EthereumSignature } from '../../types/ethereum.js'

export type EthereumAccountSignatureEntity = EthereumSignature

export type EthereumAccountSignatureStorage = EntityStorage<EthereumSignature>

export enum EthereumAccountSignatureDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
  AccountHeightIndex = 'account_height_index',
}
