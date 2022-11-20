import { EventEmitter } from 'node:events'

// @todo: Find a way to use NodeJS.ReadableStream excluding "Symbol.asyncIterator" prop (Omit doesn't work here)
interface ReadableStreamNotIterable extends EventEmitter {
  readable: boolean
  read(size?: number): string | Buffer
  setEncoding(encoding: BufferEncoding): this
  pause(): this
  resume(): this
  isPaused(): boolean
  pipe<T extends NodeJS.WritableStream>(
    destination: T,
    options?: { end?: boolean | undefined },
  ): T
  unpipe(destination?: NodeJS.WritableStream): this
  unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void
  wrap(oldStream: NodeJS.ReadableStream): this
}

/**
 * Key-value storage item
 */
export type StorageEntry<K, V> = { key: K; value: V }

export type BasicStream<V> = ReadableStreamNotIterable & {
  [Symbol.asyncIterator](): AsyncIterableIterator<V>
}

/**
 * Key-value storage stream
 */
export type StorageStream<K, V> = BasicStream<StorageEntry<K, V>>
export type StorageKeyStream<K> = BasicStream<K>
export type StorageValueStream<V> = BasicStream<V>

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
