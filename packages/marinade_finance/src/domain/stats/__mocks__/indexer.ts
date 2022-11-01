import {
  AccountIndexerState,
  GetAccountIndexingStateRequestArgs,
  IndexerMsI
} from "@aleph-indexer/framework";
import {DateTime, Interval} from "luxon";

export function mockMainIndexer() {
  return {getAccountState(args: GetAccountIndexingStateRequestArgs): Promise<AccountIndexerState | undefined> {
    return Promise.resolve({
      account: 'test',
      accurate: true,
      progress: 100,
      pending: [],
      processed: [Interval.fromDateTimes(DateTime.fromMillis(0), DateTime.now()).toISO()],
    })
  }} as IndexerMsI
}
