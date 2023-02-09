import { EntityStorage } from '@aleph-indexer/core'
import {
  createRawEntityDAL,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumRawLog } from '../../../../../types.js'

export type EthereumRawLogStorage = EntityStorage<EthereumRawLog>

/**
 * Creates a new log storage for the ethereum fetcher.
 * @param path Path to the database.
 */
export function createEthereumRawLogDAL(path: string): EthereumRawLogStorage {
  return createRawEntityDAL<EthereumRawLog>(
    path,
    IndexableEntityType.Log,
    false,
  )
}
