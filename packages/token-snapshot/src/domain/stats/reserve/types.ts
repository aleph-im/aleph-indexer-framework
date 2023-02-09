import { AccountAggregatorFnArgs } from '@aleph-indexer/framework'
import { LendingReserveStats } from '../../../types'

export type LendingReserveStatsAggregatorArgs = AccountAggregatorFnArgs

export interface LendingReserveStatsAggregator {
  aggregate(
    args: LendingReserveStatsAggregatorArgs,
  ): Promise<LendingReserveStats>
}
