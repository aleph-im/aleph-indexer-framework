import level, { LevelDB } from 'level'
import { AbstractIteratorOptions } from 'abstract-leveldown'
import path from 'path'
import fs from 'fs'
import { AlephParsedTransaction } from '../parsers/transaction.js'
import { StreamFilter, StreamMap } from '../utils/stream.js'

// @todo: define an abstract interface
export type StorageAdapter = LevelDB
export { AbstractIteratorOptions }

export class Storage<K, V> {
  constructor(protected storage: StorageAdapter) {
    process.on('beforeExit', this.destructor.bind(this))
  }

  destructor(): Promise<void> {
    return this.storage.close()
  }

  getDb(): StorageAdapter {
    return this.storage
  }

  async get(key: K): Promise<V | undefined> {
    try {
      return await this.storage.get(key)
    } catch (e) {
      if (!(e as any).notFound) throw e
    }
  }

  async exists(key: K): Promise<boolean> {
    return (await this.get(key)) !== undefined
  }

  async put(key: K, value: V): Promise<void> {
    return this.storage.put(key, value)
  }

  async del(key: K): Promise<void> {
    return this.storage.del(key)
  }

  async clear(): Promise<void> {
    return this.storage.clear()
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

  async findBoundingItem(
    options?: AbstractIteratorOptions,
  ): Promise<ReadableStorageStreamItem<K, V> | undefined> {
    const stream = this.storage.createReadStream({
      keys: true,
      values: true,
      limit: 1,
      ...options,
    })

    for await (const item of stream) {
      if (item) return item as any
    }
  }

  async findBoundingKey(
    options?: AbstractIteratorOptions,
  ): Promise<K | undefined> {
    const item = await this.findBoundingItem(options)
    if (!item) return

    return item.key
  }

  async findBoundingValue(
    options?: AbstractIteratorOptions,
  ): Promise<V | undefined> {
    const item = await this.findBoundingItem(options)
    if (!item) return

    return item.value
  }

  // @todo: Refactor and remove
  get_last_key = this.findBoundingKey
}

export type ReadableStorageStreamItem<K, V> = {
  key: K
  value: V
}

export type ReadableStorageStream<K, V> = NodeJS.ReadableStream &
  AsyncIterable<ReadableStorageStreamItem<K, V>>

export type LevelStorageFilterFn<K, V, T = V> = (
  this: LevelStorage<K, V, T>,
  entry: ReadableStorageStreamItem<K, V>,
) => Promise<boolean>

export type LevelStorageMapFn<K, V, T = V> = (
  this: LevelStorage<K, V, T>,
  entry: ReadableStorageStreamItem<K, V>,
) => Promise<ReadableStorageStreamItem<K, V>>

export interface LevelStorageOptions<K, V, T = V> {
  folder?: string
  filterFn?: LevelStorageFilterFn<K, V, T>
  mapFn?: LevelStorageMapFn<K, V, T>
}

export class LevelStorage<K, V, T = V> extends Storage<K, V> {
  static minChar = '!'
  static maxChar = '~'

  protected options?: LevelStorageOptions<K, V, T>

  private static _ensurePath(dest: string) {
    const paths = dest.split('/')
    let fullPath = ''

    for (const p of paths) {
      fullPath = path.join(fullPath, p)

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
    }
  }

  constructor(name: string, options?: LevelStorageOptions<K, V, T>) {
    const folder = options?.folder || 'data'
    const file = path.join(folder, name)
    LevelStorage._ensurePath(file)

    super(level(file, { valueEncoding: 'json' }))

    this.options = options
  }

  getAll(
    options: AbstractIteratorOptions = { reverse: true },
  ): ReadableStorageStream<K, V> {
    let stream = this.storage.createReadStream(
      options,
    ) as ReadableStorageStream<K, V>

    if (this.options) {
      const { mapFn, filterFn } = this.options

      if (mapFn) {
        stream = stream.pipe(new StreamMap(mapFn.bind(this)))
      }

      if (filterFn) {
        stream = stream.pipe(new StreamFilter(filterFn.bind(this)))
      }
    }

    return stream
  }

  async get(key: K): Promise<V | undefined> {
    const value = await super.get(key)

    if (value && this.options?.mapFn) {
      const entry = await this.options.mapFn.call(this, { key, value })
      return entry.value
    }

    return value
  }

  getKey(entry: T, ...args: any[]): K | undefined {
    throw new Error('Not implemented')
  }

  getValue(entry: T, ...args: any[]): V | undefined {
    throw new Error('Not implemented')
  }

  async save(entries: T | T[]): Promise<void> {
    entries = Array.isArray(entries) ? entries : [entries]
    if (entries.length === 0) return

    const entriesBatch = await Promise.all(
      entries
        .map((entry) => [this.getKey(entry), this.getValue(entry)])
        .filter(([key, value]) => key !== undefined && value !== undefined)
        .map(async ([key, value]) => {
          return {
            type: 'put' as const,
            key,
            value,
          }
        }),
    )

    await this.storage.batch(entriesBatch)
  }

  async remove(entries: T | T[]): Promise<void> {
    entries = Array.isArray(entries) ? entries : [entries]

    const entriesBatch = await Promise.all(
      entries
        .map((entry) => this.getKey(entry))
        .filter((key) => key !== undefined)
        .map(async (key) => {
          return {
            type: 'del' as const,
            key,
          }
        }),
    )

    await this.storage.batch(entriesBatch)
  }

  async getLastValueFromTo(
    start?: number,
    end?: number,
    options: AbstractIteratorOptions = { reverse: true },
  ): Promise<V | undefined> {
    const fromToOpts = this.getFromTo(start, end)
    const value = await this.findBoundingValue({ ...options, ...fromToOpts })

    if (value && this.options?.mapFn) {
      const entry = await this.options.mapFn.call(this, {
        key: '' as any,
        value,
      })
      return entry.value
    }

    return value
  }

  // @note: [start, end]
  getAllFromTo(
    start?: number,
    end?: number,
    options: AbstractIteratorOptions = { reverse: true },
  ): ReadableStorageStream<K, V> {
    const fromToOpts = this.getFromTo(start, end)
    return this.getAll({ ...options, ...fromToOpts })
  }

  // @note: override it
  protected getFromTo(
    start?: number,
    end?: number,
  ): { gte?: string; lt?: string } {
    // @note: LevelDb gets undefined values and cast them to strings, so:
    // {} works
    // { gte: undefined } doesn't work
    const fromToOpts: { gte?: string; lt?: string } = {}

    if (start !== undefined)
      fromToOpts.gte = `${String(start).padStart(13, '0')}`

    if (end !== undefined)
      fromToOpts.lt = `${String(end + 1).padStart(13, '0')}`

    return fromToOpts
  }

  static getAccountTxKey(acct: string, tx: AlephParsedTransaction): string {
    return `${acct}_${String(tx.slot).padStart(9, '0')}_${tx.signature}`
  }
}

export interface LevelStorageI<K, V> {
  getAll(options: AbstractIteratorOptions): ReadableStorageStream<K, V>
}

export interface LevelStorageConstructorI<K, V> {
  new (name: string, options: any): LevelStorageI<K, V>
}

export enum PoolDAL {
  Transaction = 'transaction',
  AccountTransaction = 'account_transaction',
}

export interface PoolDALFactoryI<
  T extends string = string,
  S extends LevelStorageI<unknown, unknown> = LevelStorageI<unknown, unknown>,
> {
  get(dal: T, address: string): S
}
