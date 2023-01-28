import { TimeSeries, TimeSeriesStatsConfig, TimeSeriesStatsFilters } from './types.js'
import { DateRange } from '../time.js'
import { EventBase } from '../../types.js'

/**
 * Provides outward-facing methods of the stats aggregator.
 */
export interface StatsI<I extends EventBase<any>, O> {
  config: TimeSeriesStatsConfig<I, O>;

  /**
   * Get the stats for a given interval, possibly time frame size and account.
   * @param args The interval, time frame size, limits and whether to reverse the order of the time series.
   * @param account The account to get the stats for.
   */
  getStats(account: string, args: TimeSeriesStatsFilters): Promise<TimeSeries<O>>;

  /**
   * Process the events for a given account into time frames.
   * @param account The account to process the events for.
   * @param now The current unix timestamp.
   * @param pendingDateRanges The requested time frames to process.
   * @param minDate
   */
  process(account: string, now: number, pendingDateRanges: DateRange[], minDate: number | undefined): Promise<void>;
}