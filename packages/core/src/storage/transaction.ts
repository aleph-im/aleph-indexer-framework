import { AbstractIteratorOptions } from 'abstract-leveldown'
import {
  AlephParsedTransaction,
  AlephParsedTransactionWithAccounts,
  TransactionParser,
} from '../parsers/transaction.js'
import {
  LevelStorage,
  LevelStorageOptions,
  ReadableStorageStream,
  ReadableStorageStreamItem,
  StorageAdapter,
} from './index.js'
import { StreamMap } from '../utils/index.js'

export type AlephStoredParsedTransaction = AlephParsedTransactionWithAccounts

export type SolanaTransactionLevelStorageGetOptions =
  AbstractIteratorOptions & {
    reParse?: boolean
    reSave?: boolean
  }

export type SolanaTransactionKeyInfo = {
  blocktime: number
  slot: number
  index: number
  signature: string
}

// @note: the max number of txs per slot
const MAX_INDEX = 10 ** 6

export class SolanaTransactionLevelStorage {
  // @note: [leftIndex, rightIndex]
  private _lastIndex = [
    { slot: -1, index: -1 },
    { slot: -1, index: -1 },
  ]

  protected byTimeStorage!: LevelStorage<string, AlephParsedTransaction>
  protected byIdStorage!: LevelStorage<string, string>

  constructor(
    name: string,
    protected options: LevelStorageOptions<any, any> & {
      parser?: TransactionParser
    },
  ) {
    this.byTimeStorage = new LevelStorage(`${name}_time`, options)
    this.byIdStorage = new LevelStorage(`${name}_id`, options)
  }

  getKey(tx: AlephParsedTransaction): string {
    return SolanaTransactionLevelStorage.getKey(tx)
  }

  getKeyInfo(key: string): SolanaTransactionKeyInfo {
    return SolanaTransactionLevelStorage.getKeyInfo(key)
  }

  async getLastKey(): Promise<string | undefined> {
    return this.getBoundingSlotKey(true)
  }

  async getFirstKey(): Promise<string | undefined> {
    return this.getBoundingSlotKey(false)
  }

  getDb(): StorageAdapter {
    return this.byTimeStorage.getDb()
  }

  async getBoundingSlotKey(reverse: boolean): Promise<string | undefined> {
    const stream = this.byTimeStorage.getDb().createReadStream({
      keys: true,
      values: false,
      reverse,
    })

    let lastSlot: number | undefined
    let key: string | undefined
    const deleteKeys: string[] = []

    for await (const k of stream) {
      // @note: If reverse is true, remove incomplete fetched slots (tx reverse indexing issue)
      // But take the first key otherwise
      if (!reverse) {
        key = k as string
        break
      }

      const { slot } = this.getKeyInfo(k as string)
      deleteKeys.push(k as string)

      if (!lastSlot) {
        lastSlot = slot
        continue
      }

      if (lastSlot !== slot) {
        key = deleteKeys.pop()
        break
      }
    }

    // @note: delete keys to be overriden
    if (deleteKeys.length) {
      await this.byTimeStorage.getDb().batch(
        deleteKeys.map((key) => ({
          type: 'del' as const,
          key,
        })),
      )
    }

    return key
  }

  async get(
    key: string,
    options: SolanaTransactionLevelStorageGetOptions = {
      reParse: false,
    },
  ): Promise<AlephParsedTransaction | undefined> {
    const value = await this.byTimeStorage.get(key)

    if (value && options.reParse && this.options.parser) {
      const entry = await this.postGet(options, { key, value })
      return entry.value
    }

    return value
  }

  async getBySignature(
    signature: string,
    options: SolanaTransactionLevelStorageGetOptions = {
      reParse: false,
    },
  ): Promise<AlephParsedTransaction | undefined> {
    const key = await this.byIdStorage.get(signature)
    if (!key) return
    return this.get(key, options)
  }

  getAll(
    options: SolanaTransactionLevelStorageGetOptions = { reParse: false },
  ): ReadableStorageStream<string, AlephParsedTransaction> {
    let stream = this.byTimeStorage
      .getDb()
      .createReadStream(options) as ReadableStorageStream<
      string,
      AlephParsedTransaction
    >

    if (options.reParse && this.options.parser) {
      stream = stream.pipe(new StreamMap(this.postGet.bind(this, options)))
    }

    return stream
  }

  // @note: [start, end]
  getAllFromTo(
    start?: number,
    end?: number,
    options: SolanaTransactionLevelStorageGetOptions = {
      reverse: true,
      reParse: false,
      reSave: false,
    },
  ): ReadableStorageStream<string, AlephParsedTransaction> {
    const fromToOpts = this.getFromTo(start, end)
    return this.getAll({ ...options, ...fromToOpts })
  }

  async getLastValueFromTo(
    start?: number,
    end?: number,
    options: SolanaTransactionLevelStorageGetOptions = {
      reverse: true,
      reParse: false,
      reSave: false,
    },
  ): Promise<AlephParsedTransaction | undefined> {
    const fromToOpts = this.getFromTo(start, end)
    const value = await this.byTimeStorage.findBoundingValue({
      ...options,
      ...fromToOpts,
    })

    if (value && options.reParse && this.options.parser) {
      const entry = await this.postGet(options, { key: '', value })
      return entry.value
    }

    return value
  }

  async save(
    transactions: AlephParsedTransaction | AlephParsedTransaction[],
    forward = true,
  ): Promise<void> {
    transactions = Array.isArray(transactions) ? transactions : [transactions]
    if (transactions.length === 0) return

    const txsByTimeBatch = []
    const txsByIdBatch = []

    for (const tx of transactions) {
      tx.index = tx.index || (await this.getLastIndex(tx, forward))
      const key = this.getKey(tx)

      txsByTimeBatch.push({
        type: 'put' as const,
        key,
        value: this.preSave(tx),
      })

      txsByIdBatch.push({
        type: 'put' as const,
        key: tx.signature,
        value: key,
      })
    }

    await this.byTimeStorage.getDb().batch(txsByTimeBatch)
    await this.byIdStorage.getDb().batch(txsByIdBatch)
  }

  /**
   * @note: If reverse is true, remove incomplete fetched slots
   * for avoiding wrong sorting on indexing txs of the same slot
   * example: slot N txs = [6,7,8,9,1,2,3,4,5,6,7,8,9])
   *                        \_____/ \_______________/
   *                         fetch1      fetch2
   *
   * items indexed as 1,2,3,4 from fetch2 are the same than 6,7,8,9 from fetch1
   * as tx index is calculated on our side, we have to clear all txs of the last fetched slot
   * and refetch them again to calculate the good index (Fix this by buffering fetched txs in disk
   * and having a different pipeline for processing, so we can calculate indexes starting on 0 and going forward)
   */
  protected async getLastIndex(
    tx: AlephParsedTransaction,
    forward: boolean,
  ): Promise<number> {
    const i = forward ? 0 : 1
    const last = this._lastIndex[i]
    let { slot: lastSlot, index: lastIndex } = last

    if (lastIndex < 0) {
      const key = forward ? undefined : await this.getFirstKey()
      if (key) {
        const { slot, index } = this.getKeyInfo(key)
        lastSlot = slot
        lastIndex = index
      } else {
        lastSlot = -1
        lastIndex = MAX_INDEX
      }
    }

    if (tx.slot !== lastSlot) {
      lastSlot = tx.slot
      lastIndex = MAX_INDEX
    }

    lastIndex -= 1

    last.slot = lastSlot
    last.index = lastIndex

    return lastIndex
  }

  protected async postGet(
    { reSave }: SolanaTransactionLevelStorageGetOptions,
    entry: ReadableStorageStreamItem<string, AlephParsedTransaction>,
  ): Promise<ReadableStorageStreamItem<string, AlephParsedTransaction>> {
    if (!this.options.parser) return entry

    const { key, value } = entry
    const tx = value

    // fix missing data in old db
    if (tx.transaction === null) {
      tx.transaction = tx.parsed as any
      reSave = true
    }

    const reParsedTx = this.options.parser.parse(tx)

    if (reSave) {
      await this.byTimeStorage.getDb().put(key, reParsedTx)
    }

    return { key, value: reParsedTx }
  }

  protected preSave(tx: AlephParsedTransaction): AlephStoredParsedTransaction {
    return {
      ...tx,
      accounts: this.getHistoryAccounts(tx),
    }
  }

  protected getHistoryAccounts(tx: AlephParsedTransaction): string[] {
    const accounts = new Set<string>()

    for (const ix of tx.parsed.message.instructions) {
      if (!('accounts' in ix)) continue
      const ixAccounts = ix.accounts || []

      for (const acc of ixAccounts) {
        accounts.add(acc.toString())
      }
    }

    for (const iix of tx.meta?.innerInstructions || []) {
      for (const ix of iix.instructions) {
        if (!('accounts' in ix)) continue

        const ixAccounts = ix.accounts || []

        for (const acc of ixAccounts) {
          accounts.add(acc.toString())
        }
      }
    }

    return Array.from(accounts)
  }

  protected getFromTo(
    start?: number,
    end?: number,
  ): { gte?: string; lte?: string } {
    // @note: LevelDb gets undefined values and cast them to strings, so:
    // {} works
    // { gte: undefined } doesn't work
    const fromToOpts: { gte?: string; lt?: string } = {}

    if (start !== undefined) {
      start = Math.floor(start / 1000)
      fromToOpts.gte = `${String(start).padStart(10, '0')}`
    }

    if (end !== undefined) {
      end = Math.ceil(end / 1000)
      fromToOpts.lt = `${String(end + 1).padStart(10, '0')}`
    }

    return fromToOpts
  }

  static getKey(tx: AlephParsedTransaction): string {
    // @note: timestamps in secs has 10 digits or less
    const blocktime = String(tx.blockTime || 0).padStart(10, '0')

    // @note: up to (2**64) - 1 [20 digits => MAX_SAFE_INTEGER 16 digits ATM]
    const slot = String(tx.slot).padStart(16, '0')

    // @note: up to 10**6 [6 digits]
    const index = String(tx.index).padStart(6, '0')

    return `${blocktime}_${slot}_${index}_${tx.signature}`
  }

  static getKeyInfo(key: string): SolanaTransactionKeyInfo {
    const [blocktime, slot, index, signature] = key.split('_')

    return {
      blocktime: Number(blocktime),
      slot: Number(slot),
      index: Number(index),
      signature,
    }
  }
}
