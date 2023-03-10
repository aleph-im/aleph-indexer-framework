import {
  AccountIndexerState,
  GetAccountIndexingStateRequestArgs,
  IndexerMsI,
} from '@aleph-indexer/framework'
import { DateTime, Interval } from 'luxon'
import { EventStorage } from '../../../dal/event'
import { ParsedEvents } from '../../../utils/layouts'

export async function mockMainIndexer(eventDAL: EventStorage) {
  const events = await eventDAL.getAll()
  let earliest: ParsedEvents = {} as any
  let latest: ParsedEvents = {} as any
  for await (const event of events) {
    if (event.value.timestamp < earliest.timestamp || !earliest.timestamp) {
      earliest = event.value
    }
    if (event.value.timestamp > latest.timestamp || !latest.timestamp) {
      latest = event.value
    }
  }
  return {
    getAccountState(
      args: GetAccountIndexingStateRequestArgs,
    ): Promise<AccountIndexerState | undefined> {
      return Promise.resolve({
        account: 'test',
        accurate: true,
        progress: 100,
        pending: [],
        processed: [
          Interval.fromDateTimes(
            DateTime.fromMillis(earliest.timestamp),
            DateTime.fromMillis(latest.timestamp),
          ).toISO(),
        ],
      })
    },
  } as IndexerMsI
}
