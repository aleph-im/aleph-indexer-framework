import { FetcherStateV1 } from '../indexer/fetcher/types.js'
import {
  EntityIndexStorage,
  EntityIndexStorageOptions,
} from './v2/entityIndexStorage.js'

export type FetcherStateLevelStorageOptions = Pick<
  EntityIndexStorageOptions<FetcherStateV1>,
  'path'
> & {
  name?: string
}

export class FetcherStateLevelStorage extends EntityIndexStorage<
  FetcherStateV1,
  FetcherStateV1
> {
  constructor(options: FetcherStateLevelStorageOptions) {
    super({
      name: 'fetcher_state',
      key: [{ get: (e) => e.id, length: EntityIndexStorage.VariableLength }],
      ...options,
    })
  }
}
