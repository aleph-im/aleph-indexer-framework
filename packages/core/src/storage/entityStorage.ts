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
          count: false,
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

      const { toRemove, toSave } = await this.getEntityGroups(
        entities,
        EntityUpdateOp.Update,
      )

      // @note: Order of operations is relevant for not causing inconsistent indexes lookup keys
      // and race conditions issues:
      // 1. Save Entity by id
      // 2. Save Indexes

      await super.remove(toRemove.entities, { count: toRemove.count, batch })
      await super.save(toSave.entities, { count: toSave.count, batch })

      await Promise.all(
        Object.values(this.byIndex).map(async (byIndex) => {
          // @note: Improve performance by storing in a prefixed-sublevel
          // the reverse lookup keys on each index database
          await byIndex.remove(toRemove.entities, { batch })
          await byIndex.save(toSave.entities, { batch })
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
          await byIndex.remove(toRemove.entities, { batch })
        }),
      )

      await super.remove(toRemove.entities, { count: toRemove.count, batch })

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
    toSave: {
      entities: Entity[]
      count: number
    }
    toRemove: {
      entities: Entity[]
      count: number
    }
  }> {
    const toRemove: Map<string, Entity> = new Map()
    const toSave: Map<string, Entity> = new Map()

    const checkFn =
      op === EntityUpdateOp.Update ? this.options.updateCheckFn : undefined

    for (let entity of entities) {
      let entityOp = op

      const [primaryKey] = this.getKeys(entity)

      let oldEntity = toSave.get(primaryKey)
      let oldEntityFromStore = false

      if (!oldEntity && !toRemove.has(primaryKey)) {
        oldEntity = await this.get(primaryKey)
        oldEntityFromStore = true
      }

      if (checkFn) {
        const result = await checkFn(oldEntity, entity, entityOp)

        entityOp = result.op
        entity = result.entity || entity
      }

      switch (entityOp) {
        case EntityUpdateOp.Update: {
          toSave.set(primaryKey, entity)

          if (oldEntityFromStore && oldEntity) {
            toRemove.set(primaryKey, oldEntity)
          }

          break
        }
        case EntityUpdateOp.Delete: {
          toSave.delete(primaryKey)

          if (oldEntityFromStore && oldEntity) {
            toRemove.set(primaryKey, oldEntity)
          }

          break
        }
        case EntityUpdateOp.Keep: // Noop
      }
    }

    const toSaveEntities = Array.from(toSave.values())
    const toRemoveEntities = Array.from(toRemove.values())

    return {
      toSave: {
        entities: toSaveEntities,
        count: toSaveEntities.length,
      },
      toRemove: {
        entities: toRemoveEntities,
        count: toRemoveEntities.length,
      },
    }
  }

  protected getAtomicOpMutex(atomic = false): Promise<() => void> {
    return atomic ? this.atomicOpMutex.acquire() : this.noopMutex
  }
}
