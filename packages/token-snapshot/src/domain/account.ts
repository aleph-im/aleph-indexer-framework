import { SPLTokenEventDALIndex, SPLTokenEventStorage } from '../dal/tokenEvent.js'
import { SPLTokenEvent } from '../types.js'
import { AccountEventsFilters } from './types.js'

export class Account {
  constructor(public address: string, protected eventDAL: SPLTokenEventStorage) {}

  async getEvents(filters: AccountEventsFilters): Promise<SPLTokenEvent[]> {
    const { startDate, endDate, types, skip: sk, ...opts } = filters

    const typesMap = types ? new Set(types) : undefined

    let skip = sk || 0
    const limit = opts.limit || 1000
    opts.limit = !typesMap ? limit + skip : undefined

    const result: SPLTokenEvent[] = []

    const from = startDate ? [this.address, startDate] : [this.address]
    const to = endDate ? [this.address, endDate] : [this.address]

    const events = await this.eventDAL
      .useIndex(SPLTokenEventDALIndex.AccountTimestamp)
      .getAllFromTo(from, to, opts)

    for await (const { value } of events) {
      // @note: Filter by type
      if (typesMap && !typesMap.has(value.type)) continue

      // @note: Skip first N events
      if (--skip >= 0) continue

      result.push(value)

      // @note: Stop when after reaching the limit
      if (limit > 0 && result.length >= limit) return result
    }

    return result
  }
}
