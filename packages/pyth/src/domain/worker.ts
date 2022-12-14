import { StorageStream, Utils } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  InstructionContextV1,
  IndexerWorkerDomain,
  IndexerWorkerDomainWithStats,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats,
} from '@aleph-indexer/framework'
import { eventParser as eParser } from '../parsers/event.js'
import { priceParser as pParser } from '../parsers/price.js'
import { createPriceDAL } from '../dal/price.js'
import {
  Candle,
  PythAccountInfo,
  Price,
  PythEventType,
  UpdatePriceEvent,
  PythAccountStats,
} from '../types.js'
import { AccountDomain } from './account.js'
import { createCandles } from './stats/timeSeries.js'
import { PYTH_PROGRAM_ID } from '../constants.js'
import { DateTime } from 'luxon'

const { isParsedIx, listGroupBy } = Utils

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements IndexerWorkerDomainWithStats
{
  protected accounts: Record<string, AccountDomain> = {}

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
    config: AccountIndexerConfigWithMeta<PythAccountInfo>,
  ): Promise<void> {
    const { account, meta } = config

    const accountTimeSeries = createCandles(
      account,
      this.context.apiClient,
      this.priceDAL,
      this.statsStateDAL,
      this.statsTimeSeriesDAL,
    )

    this.accounts[account] = new AccountDomain(
      meta,
      this.priceDAL,
      accountTimeSeries,
    )
    //const dataFeed = new AccountDomain(meta, this.priceDAL, accountTimeSeries)
    //this.dataFeedsByAccount[account] = dataFeed
    //this.dataFeedsBySymbol[dataFeed.info.product.symbol] = dataFeed

    console.log('Account indexing', this.context.instanceName, account)
  }

  async updateStats(account: string, now: number): Promise<void> {
    const actual = this.getAccount(account)
    await actual.updateStats(now)
  }

  async getTimeSeriesStats(
    account: string,
    type: string,
    filters: AccountStatsFilters,
  ): Promise<AccountTimeSeriesStats> {
    const actual = this.getAccount(account)
    return actual.getTimeSeriesStats(type, filters)
  }

  async getStats(account: string): Promise<AccountStats> {
    return this.getAccountStats(account)
  }

  // ------------- Custom impl methods -------------------

  async getAccountInfo(actual: string): Promise<PythAccountInfo> {
    const res = this.getAccount(actual)
    return res.info
  }

  async getAccountStats(
    actual: string,
  ): Promise<AccountStats<PythAccountStats>> {
    const res = this.getAccount(actual)
    return res.getStats()
  }

  async getHistoricalPrices(
    dataFeed: string,
    startDate: number,
    endDate: number,
    opts: any,
  ): Promise<StorageStream<string, Price>> {
    const feed = this.getAccount(dataFeed)
    return await feed.getHistoricalPrices(startDate, endDate, opts)
  }

  // @note: replaces getTimeSeriesStats
  async getCandles(
    account: string,
    timeFrame: number,
    startDate: DateTime,
    endDate: DateTime,
    opts: any,
  ): Promise<AccountTimeSeriesStats<Candle>> {
    const { limit, reverse } = opts
    const feed = this.getAccount(account)
    return await feed.getTimeSeriesStats('candle', {
      startTimestamp: startDate.toMillis(),
      endTimestamp: endDate.toMillis(),
      limit,
      reverse,
      timeFrame,
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

  private getAccount(account: string): AccountDomain {
    const accountInstance = this.accounts[account]
    if (!accountInstance) throw new Error(`Account ${account} does not exist`)
    return accountInstance
  }
}
