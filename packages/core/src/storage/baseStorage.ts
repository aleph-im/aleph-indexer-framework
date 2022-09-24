import { LevelDB } from 'level'
import { AbstractIteratorOptions } from 'abstract-leveldown'
import { StorageItem } from './types'

// @todo: define an abstract interface
export type StorageAdapter = LevelDB
export type StorageGetOptions = AbstractIteratorOptions

export abstract class BaseStorage<K, V> {
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

  async getMany(keys: K[]): Promise<V[]> {
    try {
      const many = await this.storage.getMany(keys)
      console.log('MANY !!', many, many.length)
      return many
    } catch (e) {
      console.log('MANY err', e)
      throw e
      // if (!(e as any).notFound) throw e
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
  ): Promise<StorageItem<K, V> | undefined> {
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
}
