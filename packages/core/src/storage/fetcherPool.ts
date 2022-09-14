import { PendingWorkStorage, PendingWorkStorageOptions } from './pendingWork.js'

export class FetcherPoolStorage<T> extends PendingWorkStorage<T> {
  constructor(options: PendingWorkStorageOptions<T>) {
    super({
      name: 'fetcher_pool',
      ...options,
    })
  }
}

export type FetcherPoolDAL<T> = FetcherPoolStorage<T>
