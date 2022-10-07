import { StorageStream, Utils } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  InstructionContextV1,
  IndexerWorkerDomain,
  IndexerWorkerDomainWithStats,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  candleIntervalToDuration,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { eventParser as eParser } from '../parsers/event.js'
import { priceParser as pParser } from '../parsers/price.js'
import { createPriceDAL } from '../dal/price.js'
import {
  Candle,
  CandleInterval,
  DataFeedInfo,
  Price,
  PythEventType,
  UpdatePriceEvent,
} from '../types.js'
import { DataFeed } from './data-feed.js'
import { createCandles } from './stats/timeSeries.js'
import { PYTH_PROGRAM_ID } from '../constants.js'
import { DateTime } from 'luxon'

const { isParsedIx, listGroupBy } = Utils

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements IndexerWorkerDomainWithStats
{
  protected dataFeedsByAccount: Record<string, DataFeed> = {}
  protected dataFeedsBySymbol: Record<string, DataFeed> = {}

  constructor(
    protected context: IndexerDomainContext,
    protected eventParser = eParser,
    protected priceParser = pParser,
    protected priceDAL = createPriceDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
    protected previousSlotBatch: UpdatePriceEvent[] = [],
  ) {
    super(context)
  }

  async init(): Promise<void> {
    return
  }

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<DataFeedInfo>,
  ): Promise<void> {
    const { account, meta } = config

    const accountTimeSeries = createCandles(
      account,
      this.context.apiClient,
      this.priceDAL,
      this.statsStateDAL,
      this.statsTimeSeriesDAL,
    )

    const dataFeed = new DataFeed(meta, this.priceDAL, accountTimeSeries)
    this.dataFeedsByAccount[account] = dataFeed
    this.dataFeedsBySymbol[dataFeed.info.product.symbol] = dataFeed

    console.log('Account indexing', this.context.instanceName, account)
  }

  async updateStats(account: string, now: number): Promise<void> {
    const dataFeed = this.getDataFeed(account)
    await dataFeed.updateStats(now)
  }

  async getTimeSeriesStats(
    account: string,
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    const dataFeed = this.getDataFeed(account)
    return dataFeed.getTimeSeriesStats(type, filters)
  }

  async getStats(account: string): Promise<AccountStats> {
    return this.getDataFeedStats(account)
  }

  // ------------- Custom impl methods -------------------

  async getDataFeedInfo(dataFeed: string): Promise<DataFeedInfo> {
    const feed = this.getDataFeed(dataFeed)
    return feed.info
  }

  async getDataFeedStats(dataFeed: string): Promise<AccountStats> {
    const feed = this.getDataFeed(dataFeed)
    return feed.getStats()
  }

  async getHistoricalPrices(
    dataFeed: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, Price>> {
    const feed = this.getDataFeed(dataFeed)
    return await feed.getHistoricalPrices(startDate, endDate, opts)
  }

  // @note: replaces getTimeSeriesStats
  async getCandles(
    dataFeed: string,
    candleSize: CandleInterval,
    startDate: DateTime,
    endDate: DateTime,
    opts: any,
  ): Promise<AccountTimeSeriesStats<Candle>> {
    const { limit, reverse } = opts
    const feed = this.getDataFeed(dataFeed)
    return await feed.getTimeSeriesStats('candle', {
      startDate: startDate,
      endDate: endDate,
      limit,
      reverse,
      timeFrame: candleIntervalToDuration(candleSize),
    })
  }

  protected async filterInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<InstructionContextV1[]> {
    return ixsContext.filter(({ ix }) => {
      return (
        isParsedIx(ix) &&
        ix.programId === PYTH_PROGRAM_ID &&
        ix.parsed.type === PythEventType.UpdPrice
      )
    })
  }

  protected async indexInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<void> {
    const parsedIxs = ixsContext.map((ix) => this.eventParser.parse(ix))

    console.log(`indexing ${ixsContext.length} parsed ixs`)

    // group by slot
    let slotBatches = Object.entries(
      listGroupBy(parsedIxs, (ix) => ix.pub_slot_.toNumber()),
    )

    // append previous last slot batch, if necessary
    if (
      this.previousSlotBatch.length > 0 &&
      this.previousSlotBatch[0].pub_slot_.toNumber() ===
        slotBatches[0][1][0].pub_slot_.toNumber()
    ) {
      slotBatches[0].unshift(this.previousSlotBatch)
    }
    this.previousSlotBatch = slotBatches[slotBatches.length - 1][1]
    slotBatches = slotBatches.slice(0, -1)

    // group by data feed
    const accountSlotBatches = Object.entries(
      listGroupBy(
        slotBatches,
        (batch) => batch[1][0].accounts.price_accountAccount,
      ),
    )

    // aggregate prices for each batch (data feed -> slot -> price)
    const parsedPrices = accountSlotBatches.flatMap((accountBatch) =>
      accountBatch[1].map((slotBatch) => this.priceParser.parse(slotBatch[1])),
    )

    await this.priceDAL.save(parsedPrices)
  }

  private getDataFeed(dataFeed: string): DataFeed {
    const dataFeedInstance =
      this.dataFeedsBySymbol[dataFeed] ?? this.dataFeedsByAccount[dataFeed]
    if (!dataFeedInstance)
      throw new Error(`data feed ${dataFeed} does not exist`)
    return dataFeedInstance
  }
}
