import {
  Level,
  IteratorOptions,
  KeyIteratorOptions,
  ValueIteratorOptions,
} from 'level'
import { AbstractLevel, AbstractChainedBatch } from 'abstract-level'
import { StorageEntry } from './types.js'

// @todo: define an abstract interface
export type StorageCommonOptions = { sublevel?: string; debug?: boolean }
export type StorageGetOptions<K, V> = IteratorOptions<K, V> &
  StorageCommonOptions
export type StoragePutOptions<K, V> = StorageCommonOptions & {
  batch?: AbstractChainedBatch<StorageLevel<K, V>, K, V>
}
export type StorageBatch<K, V> = AbstractChainedBatch<Level<K, V>, K, V>

export type StorageIteratorOptions<K, V> = IteratorOptions<K, V> &
  StorageCommonOptions
export type StorageKeyIteratorOptions<K> = KeyIteratorOptions<K> &
  StorageCommonOptions
export type StorageValueIteratorOptions<K, V> = ValueIteratorOptions<K, V> &
  StorageCommonOptions

export type StorageLevel<K, V> = AbstractLevel<
  string | Buffer | Uint8Array,
  K,
  V
>

export abstract class BaseStorage<K extends string, V> {
  static defaultOpts = { keyEncoding: 'utf8', valueEncoding: 'json' }
  protected sublevels: Record<string, StorageLevel<K, V>> = {}

  constructor(
    protected path: string,
    protected db: Level<K, V> = new Level(path, BaseStorage.defaultOpts),
  ) {
    process.on('beforeExit', this.close.bind(this))
  }

  close(): Promise<void> {
    return this.db.close()
  }

  protected getDb(sublevel?: string): StorageLevel<K, V> {
    if (!sublevel) return this.db

    let db = this.sublevels[sublevel]

    if (!db) {
      db = this.db.sublevel<K, V>(sublevel, BaseStorage.defaultOpts)

      this.sublevels[sublevel] = db
    }

    return db
  }

  async get(key: K, options?: StorageCommonOptions): Promise<V | undefined> {
    try {
      const db = this.getDb(options?.sublevel)
      return await db.get(key)
    } catch (e) {
      const isNotFound = (e as any)?.code === 'LEVEL_NOT_FOUND'
      if (!isNotFound) throw e
    }
  }

  async getMany(keys: K[], options?: StorageCommonOptions): Promise<V[]> {
    const db = this.getDb(options?.sublevel)
    return await db.getMany(keys)
  }

  async exists(key: K, options?: StorageCommonOptions): Promise<boolean> {
    return (await this.get(key, options)) !== undefined
  }

  async put(key: K, value: V, options?: StorageCommonOptions): Promise<void> {
    const db = this.getDb(options?.sublevel)
    return db.put(key, value)
  }

  async del(key: K, options?: StorageCommonOptions): Promise<void> {
    const db = this.getDb(options?.sublevel)
    return db.del(key)
  }

  async clear(options?: StorageCommonOptions): Promise<void> {
    const db = this.getDb(options?.sublevel)
    return db.clear()
  }

  async getLastEntry(): Promise<StorageEntry<K, V> | undefined> {
    return this.findBoundingEntry({ reverse: true })
  }

  async getFirstEntry(): Promise<StorageEntry<K, V> | undefined> {
    return this.findBoundingEntry({ reverse: false })
  }

  async getLastKey(): Promise<K | undefined> {
    return this.findBoundingKey({ reverse: true })
  }

  async getFirstKey(): Promise<K | undefined> {
    return this.findBoundingKey({ reverse: false })
  }

  async getLastValue(): Promise<V | undefined> {
    return this.findBoundingValue({ reverse: true })
  }

  async getFirstValue(): Promise<V | undefined> {
    return this.findBoundingValue({ reverse: false })
  }

  async findBoundingEntry(
    options?: StorageIteratorOptions<K, V>,
  ): Promise<StorageEntry<K, V> | undefined> {
    const db = this.getDb(options?.sublevel)
    const items = db.iterator({
      ...options,
      limit: 1,
      keys: true,
      values: true,
    })

    for await (const item of items) {
      if (item) {
        const [key, value] = item
        return { key, value }
      }
    }
  }

  async findBoundingKey(
    options?: StorageKeyIteratorOptions<K>,
  ): Promise<K | undefined> {
    const db = this.getDb(options?.sublevel)
    const items = db.keys({ ...options, limit: 1 })

    for await (const item of items) {
      if (item) return item as K
    }
  }

  async findBoundingValue(
    options?: StorageValueIteratorOptions<K, V>,
  ): Promise<V | undefined> {
    const db = this.getDb(options?.sublevel)
    const items = db.values({ ...options, limit: 1 })

    for await (const item of items) {
      if (item) return item as V
    }
  }
}
