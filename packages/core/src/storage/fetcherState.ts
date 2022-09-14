import { FetcherState } from '../indexer/fetcher/types.js'
import {
  EntityIndexStorage,
  EntityIndexStorageOptions,
} from './v2/entityIndexStorage.js'

export type FetcherStateLevelStorageOptions = Pick<
  EntityIndexStorageOptions<FetcherState>,
  'path'
> & {
  name?: string
}

export class FetcherStateLevelStorage extends EntityIndexStorage<
  FetcherState,
  FetcherState
> {
  constructor(options: FetcherStateLevelStorageOptions) {
    super({
      name: 'fetcher_state',
      key: [{ get: (e) => e.id, length: EntityIndexStorage.VariableLength }],
      ...options,
    })
  }
}
