/* eslint-disable @typescript-eslint/no-empty-function */
import path from 'node:path'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import { StreamFilter, StreamMap } from '../../utils/stream.js'
import { StorageGetOptions } from './baseStorage.js'
import { LevelStorage, StorageFilterFn, StorageMapFn } from './levelStorage.js'
import {
  KeySchema,
  StorageItem,
  StorageKeyStream,
  StorageStream,
  StorageValueStream,
  Stringifable,
} from './types.js'
import { ensurePath } from '../../utils/common.js'
import {
  StoreBackupDecoder,
  StoreBackupEncoder,
  StoreBackupRestore,
} from './utils.js'
import { Mutex } from '../../utils'

export interface EntityIndexStorageOptions<Entity> {
  name: string
  path: string
  key: KeySchema<Entity>
  entityStore?: EntityIndexStorage<Entity, Entity>
  filterFn?: StorageFilterFn<string | Entity>
  mapFn?: StorageMapFn<string | Entity>
  count?: boolean
}

export type EntityIndexStorageInvokeOptions = { atomic?: boolean }
export type EntityIndexStorageCallOptions = EntityIndexStorageInvokeOptions
export type EntityIndexStorageSaveOptions = EntityIndexStorageCallOptions & {
  count?: number
}
export type EntityIndexStorageRemoveOptions = EntityIndexStorageSaveOptions
export type EntityIndexStorageGetStreamOptions = StorageGetOptions &
  EntityIndexStorageInvokeOptions

export class EntityIndexStorage<
  Entity,
  Returned extends Entity | string = string,
> {
  static keyValueDelimiter = '|'

  // @note: https://docs.solana.com/es/cli/transfer-tokens#receive-tokens
  // The public key is a long string of base58 characters. Its length varies from 32 to 44 characters.
  static AddressLength = 44

  // @note: Timestamps in millis take 13 chars
  static TimestampLength = 13

  static VariableLength = 0

  protected self: typeof EntityIndexStorage
  protected storage: LevelStorage<string | Entity>
  protected basePath: string
  protected backupPath: string
  protected noopMutex = Promise.resolve((): void => {})
  protected count = 0

  constructor(
    protected options: EntityIndexStorageOptions<Entity>,
    protected StorageClass: typeof LevelStorage = LevelStorage,
    protected atomicOpMutex: Mutex = new Mutex(),
  ) {
    const { name, path: dir, filterFn, mapFn } = this.options
    this.basePath = path.join(dir, name)
    this.backupPath = path.join(dir, '_backup')

    this.self = this.constructor as typeof EntityIndexStorage
    this.storage = new StorageClass({ path: this.basePath, filterFn, mapFn })

    this.init()
  }

  getPaths(): { base: string; backup: string } {
    return {
      base: this.basePath,
      backup: this.backupPath,
    }
  }

  async init(): Promise<void> {
    const release = await this.getAtomicOpMutex(true)

    try {
      if (this.options.count) {
        const allKeys = this.storage.getAllKeys()
        for await (const _ of allKeys) {
          this.count++
        }
      }
    } finally {
      release()
    }
  }

  async getCount(options?: EntityIndexStorageCallOptions): Promise<number> {
    if (!this.options.count) throw new Error('Count option not configured')

    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      return this.count
    } finally {
      release()
    }
  }

  async getAll(
    options?: EntityIndexStorageGetStreamOptions,
  ): Promise<StorageStream<string, Returned>> {
    return this.getAllFromTo(undefined, undefined, options)
  }

  async getAllKeys(
    options?: EntityIndexStorageGetStreamOptions,
  ): Promise<StorageKeyStream<string>> {
    const stream = await this.getAll(options)
    return stream.pipe(new StreamMap(this.mapItemToKey.bind(this)))
  }

  async getAllValues(
    options?: EntityIndexStorageGetStreamOptions,
  ): Promise<StorageValueStream<Returned>> {
    const stream = await this.getAll(options)
    return stream.pipe(new StreamMap(this.mapItemToValue.bind(this)))
  }

  async getFirstKey(
    options?: EntityIndexStorageCallOptions,
  ): Promise<string | undefined> {
    return this.getFirstKeyFromTo(undefined, undefined, options)
  }

  async getLastKey(
    options?: EntityIndexStorageCallOptions,
  ): Promise<string | undefined> {
    return this.getLastKeyFromTo(undefined, undefined, options)
  }

  async getFirstValue(
    options?: EntityIndexStorageCallOptions,
  ): Promise<Returned | undefined> {
    return this.getFirstValueFromTo(undefined, undefined, options)
  }

  async getLastValue(
    options?: EntityIndexStorageCallOptions,
  ): Promise<Returned | undefined> {
    return this.getLastValueFromTo(undefined, undefined, options)
  }

  async getAllFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options: EntityIndexStorageGetStreamOptions = { reverse: true },
  ): Promise<StorageStream<string, Returned>> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const stream = this.storage.getAllFromTo(
        this.mapKeyChunks(start, false),
        this.mapKeyChunks(end, true),
        options,
      )

      return this.mapItems(stream)
    } finally {
      release()
    }
  }

  async getAllKeysFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageGetStreamOptions,
  ): Promise<StorageKeyStream<string>> {
    const stream = await this.getAllFromTo(start, end, options)
    return stream.pipe(new StreamMap(this.mapItemToKey.bind(this)))
  }

  async getAllValuesFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageGetStreamOptions,
  ): Promise<StorageValueStream<Returned>> {
    const stream = await this.getAllFromTo(start, end, options)
    return stream.pipe(new StreamMap(this.mapItemToValue.bind(this)))
  }

  async getFirstItemFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<StorageItem<string, Returned> | undefined> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const item = await this.storage.getFirstItemFromTo(
        this.mapKeyChunks(start, false),
        this.mapKeyChunks(end, true),
      )

      if (!item) return
      return this.mapItem(item)
    } finally {
      release()
    }
  }

  async getFirstKeyFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<string | undefined> {
    const item = await this.getFirstItemFromTo(start, end, options)
    return item?.key
  }

  async getFirstValueFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<Returned | undefined> {
    const item = await this.getFirstItemFromTo(start, end, options)
    return item?.value
  }

  async getLastItemFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<StorageItem<string, Returned> | undefined> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const item = await this.storage.getLastItemFromTo(
        this.mapKeyChunks(start, false),
        this.mapKeyChunks(end, true),
      )

      if (!item) return
      return this.mapItem(item)
    } finally {
      release()
    }
  }

  async getLastKeyFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<string | undefined> {
    const item = await this.getLastItemFromTo(start, end, options)
    return item?.key
  }

  async getLastValueFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<Returned | undefined> {
    const item = await this.getLastItemFromTo(start, end, options)
    return item?.value
  }

  async get(
    key: string | Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<Returned | undefined> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const { entityStore } = this.options

      if (
        entityStore &&
        typeof key === 'string' &&
        key.indexOf(this.self.keyValueDelimiter) >= 0
      ) {
        const mappedItem = await this.mapItem({ key, value: '' })
        return mappedItem?.value
      }

      const innerKey = this.storage.composeKey(
        Array.isArray(key) ? (this.mapKeyChunks(key, true) as string[]) : key,
      )

      const value = (await this.storage.get(innerKey)) as Returned | undefined
      if (!value) return

      const item = await this.mapItem({ key: innerKey, value })
      return item?.value
    } finally {
      release()
    }
  }

  async exists(
    key: string,
    options?: EntityIndexStorageCallOptions,
  ): Promise<boolean> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      return this.storage.exists(key)
    } finally {
      release()
    }
  }

  async save(
    entities: Entity | Entity[],
    options?: EntityIndexStorageSaveOptions,
  ): Promise<void> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      entities = Array.isArray(entities) ? entities : [entities]

      const items = entities.flatMap((entity) =>
        this.getKeys(entity).map((key) => ({
          key,
          value: this.getValue(entity),
        })),
      )
      const keys = items.map((i) => i.key)
      const countDelta = await this.getCountDelta(keys, false, options?.count)

      await this.storage.save(items)

      this.count += countDelta
    } finally {
      release()
    }
  }

  async remove(
    entities: Entity | Entity[],
    options?: EntityIndexStorageRemoveOptions,
  ): Promise<void> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      entities = Array.isArray(entities) ? entities : [entities]

      const items = entities
        .flatMap((entity) => this.getKeys(entity))
        .filter((key) => key !== undefined) as string[]

      const countDelta = await this.getCountDelta(items, true, options?.count)

      await this.storage.remove(items)

      this.count -= countDelta
    } finally {
      release()
    }
  }

  getKeys(entity: Entity): string[] {
    return this.getAllSubkeysStartingFrom(entity, 0)
  }

  async backup(): Promise<void> {
    const { name } = this.options

    console.log(`Start store backup [${name}]`)

    ensurePath(this.backupPath)

    const store = this.storage.getAll({
      reverse: false,
      keys: false,
      values: true,
    })
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
    const { name } = this.options

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

  protected getAllSubkeysStartingFrom(
    entity: Entity,
    chunk = 0,
    prevSubkeys: string[] = [],
  ): string[] {
    const schema = this.options.key[chunk]
    if (!schema) return []

    const key = schema.get(entity, prevSubkeys)
    const keys = Array.isArray(key) ? key : [key]

    return keys
      .map((key) => ({ key, keyChunk: this.getKeyChunk(key, chunk) }))
      .filter(
        (item): item is { key: string; keyChunk: string } =>
          item.keyChunk !== undefined,
      )
      .flatMap(({ key, keyChunk }) => {
        const nextKeyChunks = this.getAllSubkeysStartingFrom(
          entity,
          chunk + 1,
          prevSubkeys.concat(key),
        )

        if (nextKeyChunks.length) {
          return nextKeyChunks.map(
            (nextKeyChunk) =>
              `${keyChunk}${this.StorageClass.keyChunkDelimiter}${nextKeyChunk}`,
          )
        }

        const { entityStore } = this.options

        if (entityStore) {
          const [primaryKey] = entityStore.getKeys(entity)
          keyChunk = `${keyChunk}${this.self.keyValueDelimiter}${primaryKey}`
        }

        return [keyChunk]
      })
  }

  protected getKeyChunk(key: Stringifable, chunk = 0): string | undefined {
    if (key === undefined || key === null) return

    const schema = this.options.key[chunk]
    if (!schema)
      throw new Error(
        `Key chunk schema not found for ${this.options.name} key (chunk ${chunk})`,
      )

    const { length, padEnd } = schema
    const { minChar, maxChar } = this.StorageClass

    key = String(key)

    key =
      key === minChar
        ? key.padEnd(length, minChar)
        : key === maxChar
        ? key.padEnd(length, maxChar)
        : key

    key =
      length !== this.self.VariableLength && key.length > length
        ? padEnd
          ? key.substring(0, length)
          : key.substring(key.length - length, key.length)
        : key

    key =
      key.length < length
        ? key[padEnd ? 'padEnd' : 'padStart'](length, minChar)
        : key

    return key
  }

  protected getValue(entity: Entity): Entity | string {
    const { entityStore } = this.options

    if (entityStore) {
      // @note: Do not waste space storing the entity key as value
      // as it is already being stored as part of the index key
      return ''
    }

    return entity
  }

  protected mapKeyChunks(
    chunks?: Stringifable[],
    isEnd = false,
  ): string[] | undefined {
    if (!chunks) return

    return chunks
      .map((value, i) => {
        if ((value === undefined || value === null) && i < chunks.length - 1) {
          const { minChar, maxChar } = this.StorageClass
          value = isEnd ? maxChar : minChar
        }
        return this.getKeyChunk(value, i)
      })
      .filter((chunk): chunk is string => chunk !== undefined && chunk !== null)
  }

  protected mapItems(
    stream: StorageStream<string, Entity | string>,
  ): StorageStream<string, Returned> {
    return stream
      .pipe(new StreamMap(this.mapItem.bind(this)))
      .pipe(new StreamFilter(this.filterItem.bind(this)))
  }

  protected async mapItem(
    item: StorageItem<string, string | Entity>,
  ): Promise<StorageItem<string, Returned> | undefined> {
    const { entityStore } = this.options

    if (entityStore) {
      const { key } = item
      const [, entityKey] = key.split(this.self.keyValueDelimiter)
      const value = await entityStore.get(entityKey)

      if (value === undefined) {
        console.log(
          `🟥 Inconsistent lookup key [${entityKey}] on db [${this.options.name}]`,
        )
        return
      }

      return { key, value } as unknown as StorageItem<string, Returned>
    }

    return item as StorageItem<string, Returned>
  }

  protected async filterItem(
    item: StorageItem<string, Entity> | undefined,
  ): Promise<boolean> {
    return item !== undefined
  }

  protected mapItemToKey(item: StorageItem<string, Returned>): string {
    return item.key
  }

  protected mapItemToValue(item: StorageItem<string, Returned>): Returned {
    return item.value
  }

  protected getAtomicOpMutex(atomic = false): Promise<() => void> {
    return atomic ? this.atomicOpMutex.acquire() : this.noopMutex
  }

  protected async getCountDelta(
    items: string[],
    isDelete: boolean,
    fixedCount?: number,
  ): Promise<number> {
    if (!this.options.count) return 0
    if (fixedCount !== undefined) return fixedCount

    const storedCount = (await this.storage.getMany(items)).length
    return isDelete ? storedCount : items.length - storedCount
  }
}
