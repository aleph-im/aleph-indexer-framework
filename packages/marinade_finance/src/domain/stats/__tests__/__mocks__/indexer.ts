import {
  AccountIndexerState,
  GetAccountIndexingStateRequestArgs
} from "@aleph-indexer/framework/dist/src/services/indexer/src/types";
import {IndexerMsI} from "@aleph-indexer/framework/dist/src/services/indexer";

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
