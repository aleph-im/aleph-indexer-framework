import level from 'level'
import path from 'node:path'

import { StreamFilter, StreamMap } from '../../utils/stream.js'
import {
  StorageStream,
  StorageItem,
  StorageKeyStream,
  StorageValueStream,
} from './types.js'
import { BaseStorage, StorageGetOptions } from './baseStorage.js'
import { ensurePath } from '../../utils/common.js'

export type StorageFilterFn<V> = (
  this: LevelStorage<V>,
  entry: StorageItem<string, V>,
) => Promise<boolean>

export type StorageMapFn<V> = (
  this: LevelStorage<V>,
  entry: StorageItem<string, V>,
) => Promise<StorageItem<string, V>>

export interface LevelStorageOptions<V> {
  path: string
  filterFn?: StorageFilterFn<V>
  mapFn?: StorageMapFn<V>
}

export class LevelStorage<V> extends BaseStorage<string, V> {
  static minChar = '!'
  static maxChar = '~'
  static keyChunkDelimiter = ':'

  protected self: typeof LevelStorage
  protected options: LevelStorageOptions<V>

  constructor(options: LevelStorageOptions<V>) {
    const file = path.join(options?.path || 'data')
    ensurePath(file)

    super(level(file, { valueEncoding: 'json' }))

    this.self = this.constructor as typeof LevelStorage
    this.options = options
  }

  getAll(
    options: StorageGetOptions = { reverse: true },
  ): StorageStream<string, V> {
    let stream = this.storage.createReadStream(options) as StorageStream<
      string,
      V
    >

    const { mapFn, filterFn } = this.options

    if (mapFn) {
      stream = stream.pipe(new StreamMap(mapFn.bind(this)))
    }

    if (filterFn) {
      stream = stream.pipe(new StreamFilter(filterFn.bind(this)))
    }

    return stream
  }

  async get(key: string | string[]): Promise<V | undefined> {
    key = this.composeKey(key)
    const value = await super.get(key)

    const { mapFn } = this.options

    if (value && mapFn) {
      const entry = await mapFn.call(this, { key, value })
      return entry.value
    }

    return value
  }

  getAllKeys(options?: StorageGetOptions): StorageKeyStream<string> {
    return this.getAll(options).pipe(
      new StreamMap(this.mapItemToKey.bind(this)),
    )
  }

  getAllValues(options?: StorageGetOptions): StorageValueStream<V> {
    return this.getAll(options).pipe(
      new StreamMap(this.mapItemToValue.bind(this)),
    )
  }

  async save(
    entries:
      | StorageItem<string | string[], V>
      | StorageItem<string | string[], V>[],
  ): Promise<void> {
    entries = Array.isArray(entries) ? entries : [entries]
    if (entries.length === 0) return

    const entriesBatch = entries.map(({ key, value }) => {
      return {
        type: 'put' as const,
        key: this.composeKey(key),
        value,
      }
    })

    await this.storage.batch(entriesBatch)
  }

  async remove(keys: string | string[] | string[][]): Promise<void> {
    keys = Array.isArray(keys) ? keys : [keys]

    const keysBatch = keys.map((key) => {
      return {
        type: 'del' as const,
        key: this.composeKey(key),
      }
    })

    await this.storage.batch(keysBatch)
  }

  // @note: [start, end]
  getAllFromTo(
    start?: string | string[],
    end?: string | string[],
    options: StorageGetOptions = { reverse: true },
  ): StorageStream<string, V> {
    const fromToOpts = this.getFromToFilters(start, end)
    return this.getAll({ ...options, ...fromToOpts })
  }

  getAllFromToKeys(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions,
  ): StorageKeyStream<string> {
    return this.getAllFromTo(start, end, options).pipe(
      new StreamMap(this.mapItemToKey.bind(this)),
    )
  }

  getAllFromToValues(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions,
  ): StorageValueStream<V> {
    return this.getAllFromTo(start, end, options).pipe(
      new StreamMap(this.mapItemToValue.bind(this)),
    )
  }

  async getFirstItemFromTo(
    start?: string | string[],
    end?: string | string[],
  ): Promise<StorageItem<string, V> | undefined> {
    return this.findBoundingItemFromTo(start, end, { reverse: false })
  }

  async getFirstKeyFromTo(
    start?: string | string[],
    end?: string | string[],
  ): Promise<string | undefined> {
    return this.findBoundingKeyFromTo(start, end, { reverse: false })
  }

  async getFirstValueFromTo(
    start?: string | string[],
    end?: string | string[],
  ): Promise<V | undefined> {
    return this.findBoundingValueFromTo(start, end, { reverse: false })
  }

  async getLastItemFromTo(
    start?: string | string[],
    end?: string | string[],
  ): Promise<StorageItem<string, V> | undefined> {
    return this.findBoundingItemFromTo(start, end, { reverse: true })
  }

  async getLastKeyFromTo(
    start?: string | string[],
    end?: string | string[],
  ): Promise<string | undefined> {
    return this.findBoundingKeyFromTo(start, end, { reverse: true })
  }

  async getLastValueFromTo(
    start?: string | string[],
    end?: string | string[],
  ): Promise<V | undefined> {
    return this.findBoundingValueFromTo(start, end, { reverse: true })
  }

  async findBoundingItemFromTo(
    start?: string | string[],
    end?: string | string[],
    options: StorageGetOptions = { reverse: true },
  ): Promise<StorageItem<string, V> | undefined> {
    const fromToOpts = this.getFromToFilters(start, end)
    let item = await this.findBoundingItem({ ...options, ...fromToOpts })

    const { mapFn } = this.options

    if (item && mapFn) {
      item = await mapFn.call(this, item)
    }

    return item
  }

  async findBoundingKeyFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions,
  ): Promise<string | undefined> {
    const item = await this.findBoundingItemFromTo(start, end, options)
    if (!item) return

    return item.key
  }

  async findBoundingValueFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions,
  ): Promise<V | undefined> {
    const item = await this.findBoundingItemFromTo(start, end, options)
    if (!item) return

    return item.value
  }

  composeKey(key: string | string[]): string {
    return typeof key === 'string' ? key : key.join(this.self.keyChunkDelimiter)
  }

  // @note: override it
  protected getFromToFilters(
    start?: string | string[],
    end?: string | string[],
  ): { gte?: string; lt?: string } {
    // @note: LevelDb gets undefined values and cast them to strings, so:
    // {} works
    // { gte: undefined } doesn't work
    const fromToOpts: { gte?: string; lt?: string } = {}

    if (start !== undefined) {
      fromToOpts.gte = this.composeKey(start)
    }

    if (end !== undefined) {
      fromToOpts.lt = `${this.composeKey(end)}${this.self.maxChar}`
    }

    return fromToOpts
  }

  protected mapItemToKey(item: StorageItem<string, V>): string {
    return item.key
  }

  protected mapItemToValue(item: StorageItem<string, V>): V {
    return item.value
  }
}
