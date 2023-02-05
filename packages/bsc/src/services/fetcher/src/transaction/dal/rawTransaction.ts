import { EntityStorage } from '@aleph-indexer/core'
import {
  createRawEntityDAL,
  IndexableEntityType,
} from '@aleph-indexer/framework'
import { EthereumRawTransaction } from '../../../../../types.js'

export type EthereumRawTransactionStorage =
  EntityStorage<EthereumRawTransaction>

/**
 * Creates a new log storage for the ethereum fetcher.
 * @param path Path to the database.
 */
export function createEthereumRawTransactionDAL(
  path: string,
): EthereumRawTransactionStorage {
  return createRawEntityDAL<EthereumRawTransaction>(
    path,
    IndexableEntityType.Transaction,
    false,
  )
}
