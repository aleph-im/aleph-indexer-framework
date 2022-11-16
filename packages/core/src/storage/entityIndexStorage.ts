/* eslint-disable @typescript-eslint/no-empty-function */
import path from 'node:path'

import {
  StorageBatch,
  StorageGetOptions,
  StoragePutOptions,
} from './baseStorage.js'
import { LevelStorage, LevelStorageOptions } from './levelStorage.js'
import {
  KeySchema,
  StorageKeyStream,
  StorageStream,
  StorageEntry,
  StorageValueStream,
  Stringifable,
} from './types.js'
import { StreamFilter, StreamMap } from '../utils/stream.js'
import { Mutex } from '../utils/index.js'

export type EntityIndexStorageOptions<Entity> = LevelStorageOptions<
  string | Entity
> & {
  name: string
  sublevel?: string
  key: KeySchema<Entity>
  entityStore?: EntityIndexStorage<Entity, Entity>
  count?: boolean
}

export type EntityIndexStorageInvokeOptions = { atomic?: boolean }
export type EntityIndexStorageCallOptions = EntityIndexStorageInvokeOptions
export type EntityIndexStorageSaveOptions<V> = StoragePutOptions<string, V> &
  EntityIndexStorageInvokeOptions & {
    count?: number
  }
export type EntityIndexStorageRemoveOptions<V> =
  EntityIndexStorageSaveOptions<V>
export type EntityIndexStorageGetStreamOptions<V> = StorageGetOptions<
  string,
  V
> &
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
  protected noopMutex = Promise.resolve((): void => {})
  protected count = 0

  constructor(
    protected options: EntityIndexStorageOptions<Entity>,
    protected atomicOpMutex: Mutex = new Mutex(),
    protected storage: LevelStorage<string | Entity> = new LevelStorage({
      ...options,
      path: path.join(options.path, options.name),
    }),
  ) {
    this.self = this.constructor as typeof EntityIndexStorage
    this.init()
  }

  async init(): Promise<void> {
    const release = await this.getAtomicOpMutex(true)
    const { count, sublevel } = this.options

    try {
      if (count) {
        const allKeys = this.storage.getAllKeys({ sublevel })
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

  getBatch(): StorageBatch<string, string | Entity> {
    return this.storage.getBatch()
  }

  async getAll(
    options?: EntityIndexStorageGetStreamOptions<Returned>,
  ): Promise<StorageStream<string, Returned>> {
    return this.getAllFromTo(undefined, undefined, options)
  }

  async getAllKeys(
    options?: EntityIndexStorageGetStreamOptions<Returned>,
  ): Promise<StorageKeyStream<string>> {
    const stream = await this.getAll(options)
    return stream.pipe(new StreamMap(this.mapItemToKey.bind(this)))
  }

  async getAllValues(
    options?: EntityIndexStorageGetStreamOptions<Returned>,
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
    options: EntityIndexStorageGetStreamOptions<Returned> = { reverse: true },
  ): Promise<StorageStream<string, Returned>> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const stream = this.storage.getAllFromTo(
        this.mapKeyChunks(start, false),
        this.mapKeyChunks(end, true),
        { ...options, sublevel: this.options.sublevel },
      )

      return this.mapItems(stream)
    } finally {
      release()
    }
  }

  async getAllKeysFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageGetStreamOptions<Returned>,
  ): Promise<StorageKeyStream<string>> {
    const stream = await this.getAllFromTo(start, end, options)
    return stream.pipe(new StreamMap(this.mapItemToKey.bind(this)))
  }

  async getAllValuesFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageGetStreamOptions<Returned>,
  ): Promise<StorageValueStream<Returned>> {
    const stream = await this.getAllFromTo(start, end, options)
    return stream.pipe(new StreamMap(this.mapItemToValue.bind(this)))
  }

  async getFirstItemFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityIndexStorageCallOptions,
  ): Promise<StorageEntry<string, Returned> | undefined> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const item = await this.storage.getFirstItemFromTo(
        this.mapKeyChunks(start, false),
        this.mapKeyChunks(end, true),
        { sublevel: this.options.sublevel },
      )

      if (!item) return
      return this.mapItem(item, options?.atomic)
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
  ): Promise<StorageEntry<string, Returned> | undefined> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const item = await this.storage.getLastItemFromTo(
        this.mapKeyChunks(start, false),
        this.mapKeyChunks(end, true),
        { sublevel: this.options.sublevel },
      )

      if (!item) return
      return this.mapItem(item, options?.atomic)
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
        const mappedItem = await this.mapItem(
          { key, value: '' },
          options?.atomic,
        )
        return mappedItem?.value
      }

      const innerKey = this.storage.composeKey(
        Array.isArray(key) ? (this.mapKeyChunks(key, true) as string[]) : key,
      )

      const value = await this.storage.get(innerKey, {
        sublevel: this.options.sublevel,
      })

      if (!value) return

      const item = await this.mapItem({ key: innerKey, value }, options?.atomic)
      return item?.value
    } finally {
      release()
    }
  }

  async getMany(
    keys: string[] | Stringifable[][],
    options?: EntityIndexStorageCallOptions,
  ): Promise<Returned[]> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      const innerKeys = keys.map((key) =>
        this.storage.composeKey(
          Array.isArray(key) ? (this.mapKeyChunks(key, true) as string[]) : key,
        ),
      )

      const values = await this.storage.getMany(innerKeys, {
        sublevel: this.options.sublevel,
      })

      if (!values || !values.length) return []

      const items = await this.mapManyItem(
        values.map((v, i) => ({ key: innerKeys[i], value: v })),
        options?.atomic,
      )

      return items.map((item) => item.value)
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
      return this.storage.exists(key, { sublevel: this.options.sublevel })
    } finally {
      release()
    }
  }

  async save(
    entities: Entity | Entity[],
    options?: EntityIndexStorageSaveOptions<string | Entity>,
  ): Promise<void> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      entities = Array.isArray(entities) ? entities : [entities]

      const items = entities.flatMap((entity) => {
        return this.getKeys(entity).map(
          (key) =>
            ({ key, value: this.getValue(entity) } as StorageEntry<
              string,
              Entity
            >),
        )
      })
      const keys = items.map(({ key }) => key)
      const countDelta = await this.getCountDelta(keys, false, options?.count)

      await this.storage.save(items, {
        sublevel: this.options.sublevel,
        batch: options?.batch,
      })

      this.count += countDelta
    } finally {
      release()
    }
  }

  async remove(
    entities: Entity | Entity[],
    options?: EntityIndexStorageRemoveOptions<string | Entity>,
  ): Promise<void> {
    const release = await this.getAtomicOpMutex(options?.atomic)

    try {
      entities = Array.isArray(entities) ? entities : [entities]

      const items = entities
        .flatMap((entity) => this.getKeys(entity))
        .filter((key) => key !== undefined) as string[]

      const countDelta = await this.getCountDelta(items, true, options?.count)

      await this.storage.remove(items, {
        sublevel: this.options.sublevel,
        batch: options?.batch,
      })

      this.count -= countDelta
    } finally {
      release()
    }
  }

  getKeys(entity: Entity): string[] {
    return this.getAllSubkeysStartingFrom(entity, 0)
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
              `${keyChunk}${LevelStorage.keyChunkDelimiter}${nextKeyChunk}`,
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
        `Key chunk schema not found for ${this.options.sublevel} key (chunk ${chunk})`,
      )

    const { length, padEnd } = schema
    const { minChar, maxChar } = LevelStorage

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
          const { minChar, maxChar } = LevelStorage
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
    item: StorageEntry<string, string | Entity>,
    atomic?: boolean,
  ): Promise<StorageEntry<string, Returned> | undefined> {
    const { entityStore } = this.options

    if (entityStore) {
      const { key } = item
      const [, entityKey] = key.split(this.self.keyValueDelimiter)
      const value = await entityStore.get(entityKey)

      if (value === undefined && atomic) {
        console.log(
          `🟥 Inconsistent lookup key [${entityKey}] from key (${key}) on index [${this.options.sublevel}]`,
        )
        return
      }

      return { key: entityKey, value: value as Returned }
    }

    return item as StorageEntry<string, Returned>
  }

  protected async mapManyItem(
    items: StorageEntry<string, string | Entity>[],
    atomic?: boolean,
  ): Promise<StorageEntry<string, Returned>[]> {
    const { entityStore } = this.options

    if (entityStore) {
      const entityKeys = items
        .map((item) => item.key.split(this.self.keyValueDelimiter)?.[1])
        .filter((k) => !!k)

      const values = await entityStore.getMany(entityKeys)

      if ((!values || !values.length) && atomic) {
        console.log(
          `🟥 Inconsistent lookup keys from key on index [${this.options.sublevel}]`,
        )
        return []
      }

      return values.map((v, i) => ({
        key: entityKeys[i],
        value: v as unknown as Returned,
      }))
    }

    return items as StorageEntry<string, Returned>[]
  }

  protected async filterItem(
    item: StorageEntry<string, Entity> | undefined,
  ): Promise<boolean> {
    return item !== undefined
  }

  protected mapItemToKey(item: StorageEntry<string, Returned>): string {
    return item.key
  }

  protected mapItemToValue(item: StorageEntry<string, Returned>): Returned {
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

    const storedCount = (
      await this.storage.getMany(items, { sublevel: this.options.sublevel })
    ).length
    return isDelete ? storedCount : items.length - storedCount
  }

  async backup(): Promise<void> {
    return this.storage.backup()
  }

  async restore(): Promise<boolean> {
    return this.storage.restore()
  }
}
