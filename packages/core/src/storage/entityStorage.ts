/* eslint-disable @typescript-eslint/no-empty-function */
import path from 'node:path'

import { Mutex } from '../utils/index.js'
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
} from './types.js'

export type EntityStorageIndexOptions<Entity> = Omit<
  EntityIndexStorageOptions<Entity>,
  'path' | 'entityStore'
> & {
  name: string
}

export type EntityStorageOptions<Entity> = EntityIndexStorageOptions<Entity> & {
  name: string
  path: string
  key: PrimaryKeySchema<Entity>
  indexes?: EntityStorageIndexOptions<Entity>[]
  filterFn?: StorageFilterFn<Entity>
  mapFn?: StorageMapFn<Entity>
  updateCheckFn?: EntityUpdateCheckFn<Entity>
  count?: boolean
}

export type EntityStorageInvokeOptions = { atomic?: boolean }
export type EntityStorageCallOptions = EntityStorageInvokeOptions
export type EntityStorageGetStreamOptions<K, V> = StorageGetOptions<K, V> &
  EntityStorageInvokeOptions

/**
 * Defines the storage handler class for different entities.
 */
export class EntityStorage<Entity> extends EntityIndexStorage<Entity, Entity> {
  protected byIndex: Record<string, EntityIndexStorage<Entity, Entity>> = {}
  protected atomicOpMutex: Mutex
  protected noopMutex = Promise.resolve((): void => {})

  static AddressLength = EntityIndexStorage.AddressLength
  static TimestampLength = EntityIndexStorage.TimestampLength
  static VariableLength = EntityIndexStorage.VariableLength
  static EthereumAddressLength = EntityIndexStorage.EthereumAddressLength

  constructor(
    protected options: EntityStorageOptions<Entity>,
    protected StorageClass: typeof LevelStorage = LevelStorage,
  ) {
    const atomicOpMutex = new Mutex()
    const basePath = path.join(options.path, options.name)
    const storage = new LevelStorage({ ...options, path: basePath })

    const opts = { ...options, sublevel: 'main' }
    super(opts, atomicOpMutex, storage)

    this.options = opts
    this.atomicOpMutex = atomicOpMutex

    const { indexes } = this.options
    if (!indexes) return

    for (const index of indexes) {
      if (index.name === 'main')
        throw new Error('entity index name is reserved')

      this.byIndex[index.name] = new EntityIndexStorage(
        {
          ...options,
          sublevel: index.name,
          key: index.key,
          entityStore: this,
        },
        this.atomicOpMutex,
        storage,
      )
    }
  }

  useIndex(indexName?: string): EntityIndexStorage<Entity, Entity> {
    if (!indexName) return this

    const db = this.byIndex[indexName]
    if (db) return db

    throw new Error(
      `Invalid index "${indexName}" on "${this.options.name}" entity store`,
    )
  }

  async save(entities: Entity | Entity[]): Promise<void> {
    const release = await this.getAtomicOpMutex(true)
    const batch = this.getBatch()

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
      await super.save(toUpdate, { count, batch })

      await Promise.all(
        Object.values(this.byIndex).map(async (byIndex) => {
          // @note: Improve performance by storing in a prefixed-sublevel
          // the reverse lookup keys on each index database
          await byIndex.remove(toRemove, { batch })
          await byIndex.save(toUpdate, { batch })
        }),
      )

      await batch.write()
    } finally {
      await batch.close()
      release()
    }
  }

  async remove(entities: Entity | Entity[]): Promise<void> {
    const release = await this.getAtomicOpMutex(true)
    const batch = this.getBatch()

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
          await byIndex.remove(toRemove, { batch })
        }),
      )

      const count = toRemove.length
      await super.remove(toRemove, { count, batch })

      await batch.write()
    } finally {
      await batch.close()
      release()
    }
  }

  protected async getEntityGroups(
    entities: Entity[],
    op: EntityUpdateOp,
  ): Promise<{
    toUpdate: Entity[]
    toRemove: Entity[]
  }> {
    // @note: toUpdate should contain the latest entity version while toRemove should contain any
    // discarded version if multiple updates for the same primaryKey are performed on the same chunk
    const toRemove: Entity[] = []
    const toUpdate: Map<string, Entity> = new Map()

    const { updateCheckFn } = this.options

    for (let entity of entities) {
      const [primaryKey] = this.getKeys(entity)
      const oldEntity = toUpdate.get(primaryKey) || (await this.get(primaryKey))

      if (op === EntityUpdateOp.Update && updateCheckFn) {
        const result = await updateCheckFn(oldEntity, entity, op)

        op = result.op
        entity = result.entity || entity
      }

      switch (op) {
        case EntityUpdateOp.Update: {
          toUpdate.set(primaryKey, entity)
          if (oldEntity) toRemove.push(oldEntity)
          break
        }
        case EntityUpdateOp.Delete: {
          if (oldEntity) toRemove.push(oldEntity)
          break
        }
        case EntityUpdateOp.Keep: // noopMutex
      }
    }

    return {
      toUpdate: Array.from(toUpdate.values()),
      toRemove,
    }
  }

  protected getAtomicOpMutex(atomic = false): Promise<() => void> {
    return atomic ? this.atomicOpMutex.acquire() : this.noopMutex
  }
}
