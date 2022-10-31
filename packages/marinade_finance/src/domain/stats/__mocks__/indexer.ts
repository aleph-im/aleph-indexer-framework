import {
  AccountIndexerState,
  GetAccountIndexingStateRequestArgs,
  IndexerMsI
} from "@aleph-indexer/framework";

export function mockMainIndexer() {
  return {getAccountState(args: GetAccountIndexingStateRequestArgs): Promise<AccountIndexerState | undefined> {
    return Promise.resolve({
      account: 'test',
      accurate: true,
      progress: 100,
      pending: [],
      processed: [],
    })
  }} as IndexerMsI
}
