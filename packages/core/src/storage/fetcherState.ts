import { BaseFetcherState } from '../fetcher/base/types.js'
import {
  EntityIndexStorage,
  EntityIndexStorageOptions,
} from './entityIndexStorage.js'

export type FetcherStateLevelStorageOptions<C = any> = Pick<
  EntityIndexStorageOptions<BaseFetcherState<C>>,
  'path'
> & {
  name?: string
}

export class FetcherStateLevelStorage<C = any> extends EntityIndexStorage<
  BaseFetcherState<C>,
  BaseFetcherState<C>
> {
  constructor(options: FetcherStateLevelStorageOptions<C>) {
    super({
      name: 'fetcher_state',
      key: [{ get: (e) => e.id, length: EntityIndexStorage.VariableLength }],
      ...options,
    })
  }
}

export function createFetcherStateDAL(path: string): FetcherStateLevelStorage {
  return new FetcherStateLevelStorage({
    path,
  })
}
