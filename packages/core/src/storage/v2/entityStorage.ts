/* eslint-disable @typescript-eslint/no-empty-function */
import path from 'node:path'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

import { Mutex } from '../../utils/index.js'
import { StorageGetOptions } from './baseStorage.js'
import {
  EntityIndexStorage,
  EntityIndexStorageOptions,
} from './entityIndexStorage.js'
import { LevelStorage, StorageFilterFn, StorageMapFn } from './levelStorage.js'
import {
  EntityUpdateCheckFn,
  EntityUpdateOp,
  PrimaryKeySchema,
  StorageKeyStream,
  StorageStream,
  StorageValueStream,
  Stringifable,
} from './types.js'
import { StoreBackupDecoder, StoreBackupRestore } from './utils.js'

export interface EntityStorageOptions<Entity> {
  name: string
  path: string
  primaryKey: PrimaryKeySchema<Entity>
  indexes?: Omit<EntityIndexStorageOptions<Entity>, 'path' | 'entityStore'>[]
  filterFn?: StorageFilterFn<Entity>
  mapFn?: StorageMapFn<Entity>
  updateCheckFn?: EntityUpdateCheckFn<Entity>
  deleteCheckFn?: EntityUpdateCheckFn<Entity>
  count?: boolean
}

export type EntityStorageInvokeOptions = { atomic?: boolean }
export type EntityStorageCallOptions = EntityStorageInvokeOptions
export type EntityStorageGetStreamOptions = StorageGetOptions &
  EntityStorageInvokeOptions

export class EntityStorage<Entity> {
  protected byId: EntityIndexStorage<Entity, Entity>
  protected byIndex: Record<string, EntityIndexStorage<Entity, Entity>> = {}
  protected atomicOpMutex = new Mutex()
  protected noopMutex = Promise.resolve((): void => {})

  static AddressLength = EntityIndexStorage.AddressLength
  static TimestampLength = EntityIndexStorage.TimestampLength
  static VariableLength = EntityIndexStorage.VariableLength

  constructor(
    protected options: EntityStorageOptions<Entity>,
    protected EntityIndexStorageClass: typeof EntityIndexStorage = EntityIndexStorage,
    protected StorageClass: typeof LevelStorage = LevelStorage,
  ) {
    const { name, path: dir, filterFn, mapFn, primaryKey, count } = this.options
    const basePath = path.join(dir, name)

    this.byId = new EntityIndexStorageClass(
      {
        name: 'id',
        path: basePath,
        key: primaryKey,
        filterFn: filterFn as any,
        mapFn: mapFn as any,
        count,
      },
      this.StorageClass,
      this.atomicOpMutex,
    )

    const { indexes } = this.options
    if (!indexes) return

    for (const index of indexes) {
      this.byIndex[index.name] = new EntityIndexStorageClass(
        {
          name: index.name,
          path: basePath,
          key: index.key,
          entityStore: this.byId,
        },
        this.StorageClass,
        this.atomicOpMutex,
      )
    }
  }

  useIndex(indexName = 'id'): EntityIndexStorage<Entity, Entity> {
    let db

    if (indexName === 'id') {
      db = this.byId
    } else {
      db = this.byIndex[indexName]
    }

    if (db) return db

    throw new Error(
      `Invalid index "${indexName}" on "${this.options.name}" entity store`,
    )
  }

  getCount(options?: EntityStorageCallOptions): Promise<number> {
    return this.byId.getCount(options)
  }

  getAll(
    options?: EntityStorageGetStreamOptions,
  ): Promise<StorageStream<string, Entity>> {
    return this.getAllFromTo(undefined, undefined, options)
  }

  getAllKeys(
    options?: EntityStorageGetStreamOptions,
  ): Promise<StorageKeyStream<string>> {
    return this.getAllKeysFromTo(undefined, undefined, options)
  }

  getAllValues(
    options?: EntityStorageGetStreamOptions,
  ): Promise<StorageValueStream<Entity>> {
    return this.getAllValuesFromTo(undefined, undefined, options)
  }

  getFirstKey(options?: EntityStorageCallOptions): Promise<string | undefined> {
    return this.getFirstKeyFromTo(undefined, undefined, options)
  }

  getLastKey(options?: EntityStorageCallOptions): Promise<string | undefined> {
    return this.getLastKeyFromTo(undefined, undefined, options)
  }

  getFirstValue(
    options?: EntityStorageCallOptions,
  ): Promise<Entity | undefined> {
    return this.getFirstValueFromTo(undefined, undefined, options)
  }

  getLastValue(
    options?: EntityStorageCallOptions,
  ): Promise<Entity | undefined> {
    return this.getLastValueFromTo(undefined, undefined, options)
  }

  getAllFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageGetStreamOptions,
  ): Promise<StorageStream<string, Entity>> {
    return this.byId.getAllFromTo(start, end, options)
  }

  getAllKeysFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageGetStreamOptions,
  ): Promise<StorageKeyStream<string>> {
    return this.byId.getAllKeysFromTo(start, end, options)
  }

  getAllValuesFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageGetStreamOptions,
  ): Promise<StorageValueStream<Entity>> {
    return this.byId.getAllValuesFromTo(start, end, options)
  }

  getFirstKeyFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageCallOptions,
  ): Promise<string | undefined> {
    return this.byId.getFirstKeyFromTo(start, end, options)
  }

  getLastKeyFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageCallOptions,
  ): Promise<string | undefined> {
    return this.byId.getLastKeyFromTo(start, end, options)
  }

  getFirstValueFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageCallOptions,
  ): Promise<Entity | undefined> {
    return this.byId.getFirstValueFromTo(start, end, options)
  }

  getLastValueFromTo(
    start?: Stringifable[],
    end?: Stringifable[],
    options?: EntityStorageCallOptions,
  ): Promise<Entity | undefined> {
    return this.byId.getLastValueFromTo(start, end, options)
  }

  get(
    key: string | Stringifable[],
    options?: EntityStorageCallOptions,
  ): Promise<Entity | undefined> {
    return this.byId.get(key, options)
  }

  exists(key: string, options?: EntityStorageCallOptions): Promise<boolean>
  exists(entity: Entity, options?: EntityStorageCallOptions): Promise<boolean>
  exists(
    keyOrEntity: string | Entity,
    options?: EntityStorageCallOptions,
  ): Promise<boolean> {
    const key =
      typeof keyOrEntity === 'string'
        ? keyOrEntity
        : this.byId.getKeys(keyOrEntity)[0]

    return this.byId.exists(key, options)
  }

  async save(entities: Entity | Entity[]): Promise<void> {
    const release = await this.getAtomicOpMutex(true)

    try {
      entities = Array.isArray(entities) ? entities : [entities]

      const { toRemove, toUpdate } = await this.getEntityGroups(
        entities,
        EntityUpdateOp.Update,
      )

      // @note: Order of operations is relevant for not causing inconsistent indexes lookup keys
      // and race conditions issues:
      // 1. Save Entity by id
      // 2. Save Indexes

      const count = toUpdate.length - toRemove.length
      await this.byId.save(toUpdate, { count })

      await Promise.all(
        Object.values(this.byIndex).map(async (byIndex) => {
          // @note: Improve performance by storing in a prefixed-sublevel
          // the reverse lookup keys on each index database
          await byIndex.remove(toRemove)
          await byIndex.save(toUpdate)
        }),
      )
    } finally {
      release()
    }
  }

  async remove(entities: Entity | Entity[]): Promise<void> {
    const release = await this.getAtomicOpMutex(true)

    try {
      entities = Array.isArray(entities) ? entities : [entities]

      const { toRemove } = await this.getEntityGroups(
        entities,
        EntityUpdateOp.Delete,
      )

      // @note: Order of operations is relevant for not causing inconsistent indexes lookup keys
      // and race conditions issues:
      // 1. Remove Indexes
      // 2. Remove Entity by id

      await Promise.all(
        Object.values(this.byIndex).map(async (byIndex) => {
          // @note: Improve performance by storing in a prefixed-sublevel
          // the reverse lookup keys on each index database
          await byIndex.remove(toRemove)
        }),
      )

      const count = toRemove.length
      await this.byId.remove(toRemove, { count })
    } finally {
      release()
    }
  }

  async backup(): Promise<void> {
    // @note: Only "byId" backup is needed, all "byIndex" stores will be re-created after restoring
    await this.byId.backup()
  }

  async restore(): Promise<boolean> {
    // @note the very first version of the store will only restore data
    //  from _backup if it is completely empty
    const lastKey = await this.byId.getLastKey()
    if (lastKey) return false

    const { name } = this.options
    const { backup } = this.byId.getPaths()

    const inputPath = path.join(backup, 'id')
    if (!fs.existsSync(inputPath)) return false

    console.log(`Start entity store restore [${name}]`)

    const input = fs.createReadStream(inputPath)
    const brotli = zlib.createBrotliDecompress()

    const decoder = new StoreBackupDecoder(`Entity store restore [${name}]`)
    const store = new StoreBackupRestore(this)

    try {
      await promisify(pipeline)(input, brotli, decoder, store)
      console.log(`Complete entity store restore [${name}]`)
      return true
    } catch (e) {
      console.error(`Error entity store restore [${name}]`, e)
      return false
    }
  }

  protected async getEntityGroups(
    entities: Entity[],
    op: EntityUpdateOp,
  ): Promise<{
    toUpdate: Entity[]
    toRemove: Entity[]
  }> {
    const toRemove: Entity[] = []
    const toUpdate: Entity[] = []

    const { updateCheckFn } = this.options

    await Promise.all(
      entities.map(async (entity) => {
        const [primaryKey] = this.byId.getKeys(entity)
        const oldEntity = await this.byId.get(primaryKey)

        if (op === EntityUpdateOp.Update && updateCheckFn) {
          op = await updateCheckFn(oldEntity, entity)
        }

        switch (op) {
          case EntityUpdateOp.Update: {
            toUpdate.push(entity)
            if (oldEntity) toRemove.push(oldEntity)
            return
          }
          case EntityUpdateOp.Delete: {
            if (oldEntity) toRemove.push(oldEntity)
            return
          }
          case EntityUpdateOp.Keep: // noopMutex
        }
      }),
    )

    return {
      toUpdate,
      toRemove,
    }
  }

  protected getAtomicOpMutex(atomic = false): Promise<() => void> {
    return atomic ? this.atomicOpMutex.acquire() : this.noopMutex
  }
}
