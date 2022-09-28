/**
 * Key-value storage item
 */
export type StorageItem<K, V> = {
  key: K
  value: V
}

/**
 * A
 */
export type StorageStream<K, V> = NodeJS.ReadableStream &
  AsyncIterable<StorageItem<K, V>>
export type StorageKeyStream<K> = NodeJS.ReadableStream & AsyncIterable<K>
export type StorageValueStream<V> = NodeJS.ReadableStream & AsyncIterable<V>

// -------------------

export type KeyChunkSchema<Entity, Key> = {
  get: (entity: Entity, prevSubkeys: string[]) => Key
  length: number
  padEnd?: boolean
}

export type Stringifable = string | number | symbol | undefined | null

export type KeySchema<Entity, Key = Stringifable> = KeyChunkSchema<
  Entity,
  Key | Key[] | undefined
>[]

export type PrimaryKeySchema<Entity, Key = Stringifable> = KeyChunkSchema<
  Entity,
  Key
>[]

export enum EntityUpdateOp {
  Keep,
  Update,
  Delete,
}

export type EntityUpdateCheckFn<Entity> = (
  oldEntity: Entity | undefined,
  newEntity: Entity,
) => Promise<EntityUpdateOp>
