import { StorageStream, Utils } from '@aleph-indexer/core'
import {
  IndexerDomainContext,
  AccountIndexerConfigWithMeta,
  IndexerWorkerDomain,
  IndexerWorkerDomainWithStats,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  AccountTimeSeriesStats,
  AccountStatsFilters,
  AccountStats, ParserContext,
} from '@aleph-indexer/framework'
import {
  isParsedIx,
  SolanaIndexerWorkerDomainI,
  SolanaParsedInstructionContext,
} from '@aleph-indexer/solana'
import { eventParser as eParser } from '../parsers/event.js'
import { priceParser as pParser } from '../parsers/price.js'
import { createPriceDAL } from '../dal/price.js'
import {
  Candle,
  PythAccountInfo,
  Price,
  PythAccountStats,
  PythEvent, PythEventType,
} from '../types.js'
import { AccountDomain } from './account.js'
import { createCandles } from './stats/timeSeries.js'
import { PYTH_PROGRAM_ID } from '../constants.js'

const { listGroupBy } = Utils

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements SolanaIndexerWorkerDomainI, IndexerWorkerDomainWithStats
{
  protected accounts: Record<string, AccountDomain> = {}

  constructor(
    protected context: IndexerDomainContext,
    protected eventParser = eParser,
    protected priceParser = pParser,
    protected priceDAL = createPriceDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
    protected previousSlotBatch: PythEvent[] = [],
    protected programId = PYTH_PROGRAM_ID,
  ) {
    super(context)
  }

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<PythAccountInfo>,
  ): Promise<void> {
    const { blockchainId, account, meta } = config
    const { projectId, apiClient: indexerApi } = this.context

    const accountTimeSeries = createCandles(
      projectId,
      blockchainId,
      account,
      indexerApi,
      this.priceDAL,
      this.statsStateDAL,
      this.statsTimeSeriesDAL,
    )

    this.accounts[account] = new AccountDomain(
      meta,
      this.priceDAL,
      accountTimeSeries,
    )

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
  ): Promise<AccountTimeSeriesStats<Candle>> {
    const actual = this.getAccount(account)
    return actual.getTimeSeriesStats(type, filters)
  }

  async getStats(account: string): Promise<AccountStats> {
    return this.getAccountStats(account)
  }

  async solanaFilterInstruction(
    context: ParserContext,
    entity: SolanaParsedInstructionContext,
  ): Promise<boolean> {
    return (
      isParsedIx(entity.instruction) &&
      entity.instruction.programId === this.programId
    )
  }

  async solanaIndexInstructions(
    context: ParserContext,
    entities: SolanaParsedInstructionContext[],
  ): Promise<void> {
    console.log(`indexing ${entities.length} parsed ixs`)

    const accountIndexerContext = context as {
      account: string
      startDate: number
      endDate: number
    }
    const parsedIxs = entities.map((entity) => this.eventParser.parse(accountIndexerContext, entity))

    try {
      // group by data feed or price account
      const accountsIxns: [string, PythEvent[]][] = Object.entries(
        listGroupBy(
          parsedIxs,
          (event: PythEvent) => event.accounts.priceAccount,
        ),
      )

    // group by slots
    const accountsSlotBatches: Record<string, Record<string, PythEvent[]>> = {}
    for (const accountIxns of accountsIxns) {
      if (this.accounts[accountIxns[0]] === undefined) continue // if the account is not discovered yet

      accountsSlotBatches[accountIxns[0]] = listGroupBy(
        accountIxns[1],
        (event: PythEvent) => event.pubSlot,
      )
    }

    // aggregate prices for each batch (data feed -> slot -> price)
    const parsedPrices: Price[] = []
    for (const accountSlotBatches of Object.values(accountsSlotBatches)) {
      for (const slotBatch of Object.values(accountSlotBatches)) {
        const price = this.priceParser.parse(slotBatch, this.getAccount(slotBatch[0].accounts.priceAccount).info)
        if (price) parsedPrices.push(price)
      }
    }

    await this.priceDAL.save(parsedPrices)
    } catch (e) {
      console.error(e)
      console.log(entities[0])
      console.log(parsedIxs[0])
    }
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

  async getPriceByTimestamp(
    accountAddress: string,
    timestamp: number,
  ): Promise<Price> {
    const account = this.getAccount(accountAddress)
    return await account.getPriceByTimestamp(timestamp)
  }

  // @note: replaces getTimeSeriesStats
  async getCandles(
    account: string,
    timeFrame: number,
    startDate: number,
    endDate: number,
    opts?: any,
  ): Promise<AccountTimeSeriesStats<Candle>> {
    const { limit, reverse } = opts
    const feed = this.getAccount(account)
    return await feed.getTimeSeriesStats('candle', {
      timeFrame: timeFrame,
      startDate: startDate,
      endDate: endDate,
      limit,
      reverse,
    })
  }

  private getAccount(account: string): AccountDomain {
    const accountInstance = this.accounts[account]
    if (!accountInstance) throw new Error(`Account ${account} does not exist`)
    return accountInstance
  }
}
