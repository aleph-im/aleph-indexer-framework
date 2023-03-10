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
    if ((curr as ParsedEvents).timestamp) {
      const event = curr as ParsedEvents
      let signer: string
      signer = event.signer as unknown as string
      acc.accesses++
      acc.accessesByProgramId[signer] = acc.accessesByProgramId[signer]
        ? acc.accessesByProgramId[signer] + 1
        : 1
      if (!acc.startTimestamp || acc.startTimestamp > event.timestamp) {
        acc.startTimestamp = event.timestamp
      }
      if (!acc.endTimestamp || acc.endTimestamp < event.timestamp) {
        acc.endTimestamp = event.timestamp
      }
    } else {
      acc.accesses += (curr as AccessTimeStats).accesses || 0
      if ((curr as AccessTimeStats).accessesByProgramId) {
        Object.entries((curr as AccessTimeStats).accessesByProgramId).forEach(
          ([programId, count]) => {
            acc.accessesByProgramId[programId] = acc.accessesByProgramId[
              programId
            ]
              ? acc.accessesByProgramId[programId] + count
              : count
          },
        )
      }
      if (!acc.startTimestamp) {
        acc.startTimestamp = (curr as AccessTimeStats).startTimestamp
      } else if (
        (curr as AccessTimeStats).startTimestamp &&
        acc.startTimestamp >
          ((curr as AccessTimeStats).startTimestamp as number)
      ) {
        acc.startTimestamp = (curr as AccessTimeStats).startTimestamp
      }
      if (!acc.endTimestamp) {
        acc.endTimestamp = (curr as AccessTimeStats).endTimestamp
      } else if (
        (curr as AccessTimeStats).endTimestamp &&
        acc.endTimestamp < ((curr as AccessTimeStats).endTimestamp as number)
      ) {
        acc.endTimestamp = (curr as AccessTimeStats).endTimestamp
      }
    }
    return acc
  }

  protected isBrickEvent(
    event: ParsedEvents | AccessTimeStats,
  ): event is ParsedEvents {
    return 'type' in event
  }
}

export const accessAggregator = new AccessTimeSeriesAggregator()
export default accessAggregator
