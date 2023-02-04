import { EntityStorage } from '@aleph-indexer/core'
import {
  createRawEntityDAL,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumRawBlock } from '../../../../../types.js'

export type EthereumRawBlockStorage = EntityStorage<EthereumRawBlock>

export enum EthereumBlockDALIndex {
  Timestamp = 'timestamp',
  Height = 'height',
}

const timestampKey = {
  get: (e: EthereumRawBlock) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumRawBlock) => e.number,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

/**
 * Creates a new block storage for the ethereum fetcher.
 * @param path Path to the database.
 */
export function createEthereumRawBlockDAL(
  path: string,
): EthereumRawBlockStorage {
  return createRawEntityDAL<EthereumRawBlock>(
    path,
    IndexableEntityType.Block,
    false,
    {
      indexes: [
        {
          name: EthereumBlockDALIndex.Timestamp,
          key: [timestampKey], // signature?
        },
        {
          name: EthereumBlockDALIndex.Height,
          key: [heightKey], // signature?
        },
      ],
    },
  )
}
