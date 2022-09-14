import { EntityStorage } from '@aleph-indexer/core'
import { FetcherOptions, FetcherOptionsTypes } from '../types.js'
import { v4 as uuidv4 } from 'uuid'

export type FetcherOptionsStorage = EntityStorage<FetcherOptions>

export enum RequestsDALIndex {
  Type = 'type_index',
  TypeAccount = 'type_account_index',
}

const idKey = {
  get: (e: FetcherOptions) => e.id,
  length: EntityStorage.VariableLength,
}

const typeKey = {
  get: (e: FetcherOptions) => e.type,
  length: EntityStorage.VariableLength,
}

const accountKey = {
  get: (e: FetcherOptions) => e.options.account,
  length: EntityStorage.VariableLength,
}

/**
 * Creates a new fetcher options storage for the fetcher, which records the requests the fetcher is processing.
 * @param path Path to the database.
 */
export function createRequestsDAL(path: string): FetcherOptionsStorage {
  return new EntityStorage<FetcherOptions>({
    name: 'fetcher_requests',
    path,
    primaryKey: [idKey],
    indexes: [
      {
        name: RequestsDALIndex.Type,
        key: [typeKey],
      },
      {
        name: RequestsDALIndex.TypeAccount,
        key: [typeKey, accountKey],
      },
    ],
  })
}

/**
 * Creates a database entry for a fetcher request.
 * @param type
 * @param options
 */
export function createFetcherOptions(
  type: FetcherOptionsTypes,
  options: any,
): FetcherOptions {
  return {
    id: uuidv4(),
    type,
    options,
  }
}
