import { AccessTimeStats } from '../../types.js'
import { ParsedEvents } from '../../utils/layouts/index.js'

export class AccessTimeSeriesAggregator {
  aggregate(
    curr: ParsedEvents | AccessTimeStats,
    prev?: AccessTimeStats,
  ): AccessTimeStats {
    prev = this.prepareAccessStats(prev)

    this.processAccessStats(prev, curr)

    return prev
  }

  getEmptyAccessTimeStats(): AccessTimeStats {
    return {
      accesses: 0,
      accessesByProgramId: {},
      startTimestamp: undefined,
      endTimestamp: undefined,
    }
  }

  protected prepareAccessStats(info?: AccessTimeStats): AccessTimeStats {
    return info || this.getEmptyAccessTimeStats()
  }

  // @note: We assume that curr data is sorted by time
  protected processAccessStats(
    acc: AccessTimeStats,
    curr: ParsedEvents | AccessTimeStats,
  ): AccessTimeStats {
    if ((curr as ParsedEvents).data?.programId) {
      const programId = (curr as ParsedEvents).data.programId.toBase58()
      acc.accesses++
      acc.accessesByProgramId[programId] = acc.accessesByProgramId[programId] ? acc.accessesByProgramId[programId] + 1 : 1
      acc.startTimestamp = acc.startTimestamp || (curr as ParsedEvents).timestamp
      acc.endTimestamp = (curr as ParsedEvents).timestamp || acc.endTimestamp
    } else {
      acc.accesses += (curr as AccessTimeStats).accesses
      if ((curr as AccessTimeStats).accessesByProgramId) {
        Object.entries((curr as AccessTimeStats).accessesByProgramId).forEach(([programId, count]) => {
          acc.accessesByProgramId[programId] = acc.accessesByProgramId[programId] ? acc.accessesByProgramId[programId] + count : count
        })
      }
      acc.startTimestamp = acc.startTimestamp || (curr as AccessTimeStats).startTimestamp
      acc.endTimestamp = (curr as AccessTimeStats).endTimestamp || acc.endTimestamp
    }
    return acc
  }

  protected isMarinadeFinanceEvent(
    event: ParsedEvents | AccessTimeStats,
  ): event is ParsedEvents {
    return 'type' in event
  }
}

export const accessAggregator = new AccessTimeSeriesAggregator()
export default accessAggregator
