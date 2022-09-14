import { Utils } from '@aleph-indexer/core'
import { LayoutHub } from './layoutHub.js'

export class LayoutFactory extends Utils.AsyncModuleFactory {
  protected static baseModuleId: string | undefined = undefined

  static async importModule(moduleId: string): Promise<any> {
    return import(`./impl/${moduleId}.js`)
  }

  static async get(account: string, ...args: any[]): Promise<any | undefined> {
    const moduleId = LayoutHub[account]

    const instance = await super.get(moduleId, ...args).catch(() => undefined)
    return instance
  }
}
