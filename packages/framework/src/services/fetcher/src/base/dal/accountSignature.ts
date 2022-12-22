import { EntityStorage } from '@aleph-indexer/core'

export type AccountSignatureStorageEntity = { signature: string }

export type AccountSignatureStorage<T extends AccountSignatureStorageEntity> =
  EntityStorage<T>

export enum AccountSignatureDALIndex {
  AccountTimestampIndex = 'account_timestamp_index',
}
