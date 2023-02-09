import { Utils } from '@aleph-indexer/core'

export class ReserveStatsAggregatorFactory extends Utils.AsyncModuleFactory {
  static async importModule(moduleId: string): Promise<any> {
    return import(`./impl/${moduleId}.js`)
  }
}

export default ReserveStatsAggregatorFactory
