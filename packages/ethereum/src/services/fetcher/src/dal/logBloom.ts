import { EntityStorage } from '@aleph-indexer/core'
import { EthereumLogBloom } from '../../../../types.js'

export type EthereumLogBloomEntity = EthereumLogBloom

export type EthereumLogBloomStorage = EntityStorage<EthereumLogBloom>

export enum EthereumLogBloomDALIndex {
  Timestamp = 'timestamp',
}

const timestampKey = {
  get: (e: EthereumLogBloomEntity) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumLogBloomEntity) => e.height,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

/**
 * Creates a new block storage for the ethereum fetcher.
 * @param path Path to the database.
 */
export function createEthereumLogBloomDAL(
  path: string,
): EthereumLogBloomStorage {
  return new EntityStorage<EthereumLogBloomEntity>({
    name: 'fetcher_block_log_bloom',
    path,
    key: [heightKey],
    indexes: [
      {
        name: EthereumLogBloomDALIndex.Timestamp,
        key: [timestampKey], // signature?
      },
    ],
  })
}
