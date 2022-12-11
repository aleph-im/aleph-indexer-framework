import { Utils } from '@aleph-indexer/core'

export class BlockchainWorkerFactory extends Utils.AsyncModuleFactory {
  protected static baseModuleId: string | undefined = undefined

  static async importModule(moduleId: string): Promise<any> {
    return import(`./impl/${moduleId}.js`)
  }
}
