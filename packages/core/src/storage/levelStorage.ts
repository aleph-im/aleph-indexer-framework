import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { EntryStream, KeyStream, ValueStream } from 'level-read-stream'

import { StreamFilter, StreamMap } from '../utils/stream.js'
import {
  StorageStream,
  StorageEntry,
  StorageKeyStream,
  StorageValueStream,
} from './types.js'
import {
  BaseStorage,
  StorageBatch,
  StorageCommonOptions,
  StorageGetOptions,
  StoragePutOptions,
} from './baseStorage.js'
import {
  StoreBackupDecoder,
  StoreBackupEncoder,
  StoreBackupRestore,
} from './utils.js'
import { Level } from 'level'

export type StorageFilterKeyFn<V> = (
  this: LevelStorage<V>,
  entry: string,
) => Promise<boolean>

export type StorageFilterValueFn<V> = (
  this: LevelStorage<V>,
  entry: V,
) => Promise<boolean>

export type StorageFilterFn<V> = (
  this: LevelStorage<V>,
  entry: StorageEntry<string, V>,
) => Promise<boolean>

export type StorageMapKeyFn<V> = (
  this: LevelStorage<V>,
  entry: string,
) => Promise<string>

export type StorageMapValueFn<V> = (
  this: LevelStorage<V>,
  entry: V,
) => Promise<V>

export type StorageMapFn<V> = (
  this: LevelStorage<V>,
  entry: StorageEntry<string, V>,
) => Promise<StorageEntry<string, V>>

export type LevelStorageOptions<V> = {
  path: string
  filterKeyFn?: StorageFilterKeyFn<V>
  filterValueFn?: StorageFilterValueFn<V>
  mapKeyFn?: StorageMapKeyFn<V>
  mapValueFn?: StorageMapValueFn<V>
}

export class LevelStorage<V> extends BaseStorage<string, V> {
  static minChar = '!'
  static maxChar = '~'
  static keyChunkDelimiter = ':'

  protected self: typeof LevelStorage
  protected backupPath: string

  protected filterFn?: StorageFilterFn<V>
  protected mapFn?: StorageMapFn<V>

  constructor(
    protected options: LevelStorageOptions<V>,
    db?: Level<string, V>,
  ) {
    super(options.path, db)

    this.self = this.constructor as typeof LevelStorage
    this.backupPath = path.join(options.path, '..', '_backup')

    const { filterKeyFn, filterValueFn, mapKeyFn, mapValueFn } = this.options

    if (filterKeyFn || filterValueFn) {
      this.filterFn = async ({ key, value }) =>
        (filterKeyFn ? await filterKeyFn.call(this, key) : true) &&
        (filterValueFn ? await filterValueFn.call(this, value) : true)
    }

    if (mapKeyFn || mapValueFn) {
      this.mapFn = async ({ key, value }) => ({
        key: mapKeyFn ? await mapKeyFn.call(this, key) : key,
        value: mapValueFn ? await mapValueFn.call(this, value) : value,
      })
    }
  }

  composeKey(key: string | string[]): string {
    return typeof key === 'string' ? key : key.join(this.self.keyChunkDelimiter)
  }

  getBatch(): StorageBatch<string, V> {
    return this.db.batch()
  }

  async get(
    key: string | string[],
    options?: StorageCommonOptions,
  ): Promise<V | undefined> {
    key = this.composeKey(key)
    const value = await super.get(key, options)

    const { mapValueFn } = this.options

    if (value && mapValueFn) {
      return await mapValueFn.call(this, value)
    }

    return value
  }

  async getMany(keys: string[], options?: StorageCommonOptions): Promise<V[]> {
    keys = keys.map((key) => this.composeKey(key))
    const values = await super.getMany(keys, options)

    const { mapValueFn } = this.options

    if (values && values.length && mapValueFn) {
      return Promise.all(values.map((value) => mapValueFn.call(this, value)))
    }

    return values
  }

  getAll(
    options: StorageGetOptions<string, V> = { reverse: true },
  ): StorageStream<string, V> {
    const db = this.getDb(options.sublevel)

    let stream = new EntryStream(db, options) as unknown as StorageStream<
      string,
      V
    >

    if (this.mapFn) {
      stream = stream.pipe(new StreamMap(this.mapFn.bind(this)))
    }

    if (this.filterFn) {
      stream = stream.pipe(new StreamFilter(this.filterFn.bind(this)))
    }

    return stream
  }

  getAllKeys(options?: StorageGetOptions<string, V>): StorageKeyStream<string> {
    const db = this.getDb(options?.sublevel)

    let stream = new KeyStream(
      db,
      options,
    ) as unknown as StorageKeyStream<string>

    const { mapKeyFn, filterKeyFn } = this.options

    if (mapKeyFn) {
      stream = stream.pipe(new StreamMap(mapKeyFn.bind(this)))
    }

    if (filterKeyFn) {
      stream = stream.pipe(new StreamFilter(filterKeyFn.bind(this)))
    }

    return stream
  }

  getAllValues(options?: StorageGetOptions<string, V>): StorageValueStream<V> {
    const db = this.getDb(options?.sublevel)

    let stream = new ValueStream(
      db,
      options,
    ) as unknown as StorageValueStream<V>

    const { mapValueFn, filterValueFn } = this.options

    if (mapValueFn) {
      stream = stream.pipe(new StreamMap(mapValueFn.bind(this)))
    }

    if (filterValueFn) {
      stream = stream.pipe(new StreamFilter(filterValueFn.bind(this)))
    }

    return stream
  }

  async save(
    entries: StorageEntry<string | string[], V>[],
    options?: StoragePutOptions<string, V>,
  ): Promise<void> {
    if (entries.length === 0) return

    const db = this.getDb(options?.sublevel)
    const batch = options?.batch || db.batch()

    entries.forEach(({ key, value }) =>
      batch.put(this.composeKey(key), value, {
        sublevel: db as any,
      }),
    )

    if (!options?.batch) await batch.write()
  }

  async remove(
    keys: (string | string[])[],
    options?: StoragePutOptions<string, V>,
  ): Promise<void> {
    if (keys.length === 0) return

    const db = this.getDb(options?.sublevel)
    const batch = options?.batch || db.batch()

    keys.forEach((key) =>
      batch.del(this.composeKey(key), {
        sublevel: db as any,
      }),
    )

    if (!options?.batch) await batch.write()
  }

  // @note: [start, end]
  getAllFromTo(
    start?: string | string[],
    end?: string | string[],
    options: StorageGetOptions<string, V> = { reverse: true },
  ): StorageStream<string, V> {
    const fromToOpts = this.getFromToFilters(start, end)
    return this.getAll({ ...options, ...fromToOpts })
  }

  getAllKeysFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions<string, V>,
  ): StorageKeyStream<string> {
    const fromToOpts = this.getFromToFilters(start, end)
    return this.getAllKeys({ ...options, ...fromToOpts })
  }

  getAllValuesFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions<string, V>,
  ): StorageValueStream<V> {
    const fromToOpts = this.getFromToFilters(start, end)
    return this.getAllValues({ ...options, ...fromToOpts })
  }

  async getFirstItemFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageCommonOptions,
  ): Promise<StorageEntry<string, V> | undefined> {
    return this.findBoundingItemFromTo(start, end, {
      ...options,
      reverse: false,
    })
  }

  async getFirstKeyFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageCommonOptions,
  ): Promise<string | undefined> {
    return this.findBoundingKeyFromTo(start, end, {
      ...options,
      reverse: false,
    })
  }

  async getFirstValueFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageCommonOptions,
  ): Promise<V | undefined> {
    return this.findBoundingValueFromTo(start, end, {
      ...options,
      reverse: false,
    })
  }

  async getLastItemFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageCommonOptions,
  ): Promise<StorageEntry<string, V> | undefined> {
    return this.findBoundingItemFromTo(start, end, {
      ...options,
      reverse: true,
    })
  }

  async getLastKeyFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageCommonOptions,
  ): Promise<string | undefined> {
    return this.findBoundingKeyFromTo(start, end, { ...options, reverse: true })
  }

  async getLastValueFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageCommonOptions,
  ): Promise<V | undefined> {
    return this.findBoundingValueFromTo(start, end, {
      ...options,
      reverse: true,
    })
  }

  protected async findBoundingItemFromTo(
    start?: string | string[],
    end?: string | string[],
    options: StorageGetOptions<string, V> = { reverse: true },
  ): Promise<StorageEntry<string, V> | undefined> {
    const fromToOpts = this.getFromToFilters(start, end)
    let item = await this.findBoundingEntry({ ...options, ...fromToOpts })

    if (item && this.mapFn) {
      item = await this.mapFn(item)
    }

    return item
  }

  protected async findBoundingKeyFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions<string, V>,
  ): Promise<string | undefined> {
    const fromToOpts = this.getFromToFilters(start, end)
    let key = await this.findBoundingKey({ ...options, ...fromToOpts })

    const { mapKeyFn } = this.options

    if (key && mapKeyFn) {
      key = await mapKeyFn.call(this, key)
    }

    return key
  }

  protected async findBoundingValueFromTo(
    start?: string | string[],
    end?: string | string[],
    options?: StorageGetOptions<string, V>,
  ): Promise<V | undefined> {
    const fromToOpts = this.getFromToFilters(start, end)
    let value = await this.findBoundingValue({ ...options, ...fromToOpts })

    const { mapValueFn } = this.options

    if (value && mapValueFn) {
      value = await mapValueFn.call(this, value)
    }

    return value
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

  async backup(): Promise<void> {
    const name = path.basename(this.options.path)

    console.log(`Start store backup [${name}]`)

    const store = this.getAllValues({ reverse: false })
    const encoder = new StoreBackupEncoder(`store backup [${name}]`)
    const brotli = zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        [zlib.constants.BROTLI_PARAM_QUALITY]: 10,
      },
    })
    const outputPath = path.join(this.backupPath, name)
    const output = fs.createWriteStream(outputPath)

    try {
      await promisify(pipeline)(store, encoder, brotli, output)
      console.log(`Complete store backup [${name}]`)
    } catch (e) {
      console.error(`Error store backup [${name}]`, e)
    }
  }

  async restore(): Promise<boolean> {
    // @note the very first version of the store will only restore data
    //  from _backup if it is completely empty
    const lastKey = await this.getLastKey()
    if (lastKey) return false

    const name = path.basename(this.options.path)

    const inputPath = path.join(this.backupPath, name)
    if (!fs.existsSync(inputPath)) return false

    console.log(`Start store restore [${name}]`)

    const input = fs.createReadStream(inputPath)
    const brotli = zlib.createBrotliDecompress()
    const decoder = new StoreBackupDecoder(`Store restore [${name}]`)
    const store = new StoreBackupRestore(this)

    try {
      await promisify(pipeline)(input, brotli, decoder, store)
      console.log(`Complete store restore [${name}]`)
      return true
    } catch (e) {
      console.error(`Error store restore [${name}]`, e)
      return false
    }
  }
}
