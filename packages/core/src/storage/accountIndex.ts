import { pipeline } from 'node:stream'
import { StreamMap, StreamFilter } from '../utils/stream.js'
import {
  AbstractIteratorOptions,
  LevelStorage,
  ReadableStorageStream,
  ReadableStorageStreamItem,
} from './common.js'

export abstract class AccountIndexLevelStorage<
  T = string,
  M = string,
> extends LevelStorage<string, string, T> {
  abstract getKey(entity: T, account: string): string
  protected abstract getAccounts(entity: T): string[]

  // @note: waste the least posible disc space
  getValue(entity: T, account: string): string {
    return ''
  }

  async save(entries: T | T[]): Promise<void> {
    entries = Array.isArray(entries) ? entries : [entries]
    if (entries.length === 0) return

    const entriesBatch = await Promise.all(
      entries
        .flatMap((entry) =>
          this.getAccounts(entry).map((account) => ({
            entry,
            account,
          })),
        )
        .map(({ entry, account }) => [
          this.getKey(entry, account),
          this.getValue(entry, account),
        ])
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

  async getLastEntityKey(
    account: string,
    start?: number,
    end?: number,
  ): Promise<string | undefined> {
    const fromToOpts = this.getEntityFromTo(account, start, end)
    return super.findBoundingKey({ ...fromToOpts, reverse: true })
  }

  async getLastEntityValue(
    account: string,
    start?: number,
    end?: number,
  ): Promise<M | undefined> {
    const lastKey = await this.getLastEntityKey(account, start, end)
    if (!lastKey) return

    const { value } = await this.mapKey(lastKey)
    return value
  }

  async getFirstEntityKey(
    account: string,
    start?: number,
    end?: number,
  ): Promise<string | undefined> {
    const fromToOpts = this.getEntityFromTo(account, start, end)
    return super.findBoundingKey({ ...fromToOpts, reverse: false })
  }

  async getFirstEntityValue(
    account: string,
    start?: number,
    end?: number,
  ): Promise<M | undefined> {
    const firstKey = await this.getFirstEntityKey(account, start, end)
    if (!firstKey) return

    const { value } = await this.mapKey(firstKey)
    return value
  }

  getAllEntities(
    account?: string,
    options: AbstractIteratorOptions = { reverse: true },
  ): ReadableStorageStream<string, M> {
    let stream

    if (account) {
      const fromToOpts = this.getEntityFromTo(account)
      stream = super.getAll({ ...options, ...fromToOpts })
    } else {
      stream = super.getAll(options)
    }

    return this.mapKeysToEntities(stream)
  }

  // @note: [start, end]
  getAllEntitiesFromTo(
    account: string,
    start?: number,
    end?: number,
    options: AbstractIteratorOptions = { reverse: true },
  ): ReadableStorageStream<string, M> {
    const fromToOpts = this.getEntityFromTo(account, start, end)
    const stream = super.getAll({ ...options, ...fromToOpts })

    return this.mapKeysToEntities(stream)
  }

  protected mapKeysToEntities(
    stream: ReadableStorageStream<string, string>,
  ): ReadableStorageStream<string, M> {
    return pipeline(
      stream,
      new StreamMap((item: ReadableStorageStreamItem<string, string>) =>
        this.mapKey(item.key),
      ),
      new StreamFilter(
        ({ value }: ReadableStorageStreamItem<string, string>) =>
          value !== undefined,
      ),
    )
  }

  // @override this
  protected async mapKey(
    key: string,
  ): Promise<ReadableStorageStreamItem<string, M | undefined>> {
    const [account, value] = key.split('|')
    return { key: account, value: value as unknown as M }
  }

  protected getEntityFromTo(
    account: string,
    start?: number,
    end?: number,
  ): { gte: string; lt: string } {
    const gte =
      start !== undefined
        ? `${account}|${String(start).padStart(13, '0')}`
        : account

    const lt =
      end !== undefined
        ? `${account}|${String(end + 1).padStart(13, '0')}`
        : `${account}${LevelStorage.maxChar}`

    return { gte, lt }
  }
}
