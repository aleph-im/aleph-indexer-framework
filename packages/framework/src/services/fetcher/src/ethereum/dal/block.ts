import { EntityStorage, EthereumBlock } from '@aleph-indexer/core'

export type EthereumBlockStorage = EntityStorage<EthereumBlock>

export enum EthereumBlockDALIndex {
  Timestamp = 'timestamp',
  Height = 'height',
}

const signatureKey = {
  get: (e: EthereumBlock) => e.hash.toLowerCase(),
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: (e: EthereumBlock) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

const heightKey = {
  get: (e: EthereumBlock) => e.number,
  // @note: up to 10**9 [9 digits] enough for 300 years
  length: 8,
}

/**
 * Creates a new block storage for the ethereum fetcher.
 * @param path Path to the database.
 */
export function createEthereumBlockDAL(path: string): EthereumBlockStorage {
  return new EntityStorage<EthereumBlock>({
    name: 'fetcher_raw_block',
    path,
    key: [signatureKey],
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
  })
}
