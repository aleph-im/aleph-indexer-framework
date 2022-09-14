import { SolanaTransactionLevelStorage, Storage } from '../storage'
import { IndexerRunOptions } from './common.js'

export interface IndexerOptions extends IndexerRunOptions {
  address: string
  dal: Record<string, Storage<any, any> | SolanaTransactionLevelStorage> & {
    history: SolanaTransactionLevelStorage
  }
}

export abstract class Indexer {
  constructor(protected options: IndexerOptions) {}

  protected async detectUntil(
    options: IndexerOptions,
  ): Promise<string | undefined> {
    const { until, detectUntil } = options
    const { dal } = this.options

    if (!until && detectUntil) {
      const lastKey = await dal.history.getLastKey()

      if (lastKey) {
        const { signature } = dal.history.getKeyInfo(lastKey)
        return signature
      }
    }

    return until
  }

  protected async getLastSignature(): Promise<string | undefined> {
    const { dal } = this.options

    const key = await dal.history.getLastKey()
    if (key) {
      const { signature } = dal.history.getKeyInfo(key)
      return signature
    }
  }

  protected async getFirstSignature(): Promise<string | undefined> {
    const { dal } = this.options

    const key = await dal.history.getFirstKey()
    if (key) {
      const { signature } = dal.history.getKeyInfo(key)
      return signature
    }
  }

  abstract run(opts: Partial<IndexerRunOptions>): Promise<void>
}
