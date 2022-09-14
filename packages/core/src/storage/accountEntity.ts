import { AccountIndexLevelStorage } from './accountIndex.js'
import {
  LevelStorage,
  LevelStorageOptions,
  ReadableStorageStreamItem,
} from './common.js'

export type AccountEntityLevelStorageOptions<T> = LevelStorageOptions<
  string,
  string,
  T
> & {
  entityDAL: LevelStorage<string, T>
}

export abstract class AccountEntityLevelStorage<
  T,
> extends AccountIndexLevelStorage<T, T> {
  constructor(
    name: string,
    protected options: AccountEntityLevelStorageOptions<T>,
  ) {
    super(name, options)
  }

  protected abstract getAccounts(entity: T): string[]

  getKey(entity: T, account: string): string {
    return `${account}|${this.options.entityDAL.getKey(entity)}`
  }

  getKeyInfo(key: string): { account: string; entityKey: string } {
    const [account, entityKey] = key.split('|')
    return { account, entityKey }
  }

  protected async mapKey(
    key: string,
  ): Promise<ReadableStorageStreamItem<string, T | undefined>> {
    const [, entityKey] = key.split('|')
    const value: T | undefined = await this.options.entityDAL.get(entityKey)

    // @note: Delete inconsistent lookup keys
    if (value === undefined) {
      await this.del(entityKey)
    }

    return { key: entityKey, value }
  }
}
