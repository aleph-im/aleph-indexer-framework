import BN from 'bn.js'
import {
  AccountIndexerConfigWithMeta,
  AccountStatsFilters,
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  IndexerDomainContext,
  IndexerWorkerDomain,
  IndexerWorkerDomainWithStats,
  InstructionContextV1,
} from '@aleph-indexer/framework'
import { PendingWork, PendingWorkPool } from '@aleph-indexer/core'
import {
  createTokenEventParser,
  TokenEventParser,
} from '../parsers/tokenEvent.js'
import { LendingEventParser } from '../parsers/lendingEvent.js'
import { mintParser as mParser } from '../parsers/mint.js'
import { createSPLTokenEventDAL } from '../dal/tokenEvent.js'
import {
  Balances,
  Event,
  LendingEvent, LendingEventType,
  SPLTokenAccount,
  SPLTokenEvent,
  SPLTokenEventCloseAccount,
  SPLTokenEventType,
  SPLTokenHolding,
  SPLTokenType,
} from '../types.js'
import { Mint } from './mint.js'
import {getLendingMarketType, LendingMarketType, TOKEN_PROGRAM_ID} from '../constants.js'
import {
  getWalletBalanceFromEvent,
  getSPLTokenEventAccounts,
  isParsableInstruction,
  isSPLLendingInstruction,
  isSPLTokenInstruction,
} from '../utils/utils.js'
import { createFetchMintDAL } from '../dal/fetchMint.js'
import { MintAccount, TokenHoldersFilters } from './types.js'
import { createBalanceHistoryDAL } from '../dal/balanceHistory.js'
import { createBalanceStateDAL } from '../dal/balanceState.js'
import { createAccountMintDAL } from '../dal/accountMints.js'
import { createLendingEventDAL } from "../dal/lendingEvent.js";

export default class WorkerDomain
  extends IndexerWorkerDomain
  implements IndexerWorkerDomainWithStats
{
  public mints: Record<string, Mint> = {}
  public accountMints: PendingWorkPool<MintAccount>

  constructor(
    protected context: IndexerDomainContext,
    protected tokenEventParser: TokenEventParser,
    protected lendingEventParser: LendingEventParser,
    protected mintParser = mParser,
    protected tokenEventDAL = createSPLTokenEventDAL(context.dataPath),
    protected lendingEventDAL = createLendingEventDAL(context.dataPath),
    protected statsStateDAL = createStatsStateDAL(context.dataPath),
    protected statsTimeSeriesDAL = createStatsTimeSeriesDAL(context.dataPath),
    protected fetchMintDAL = createFetchMintDAL(context.dataPath),
    protected balanceHistoryDAL = createBalanceHistoryDAL(context.dataPath),
    protected balanceStateDAL = createBalanceStateDAL(context.dataPath),
    protected accountMintDAL = createAccountMintDAL(context.dataPath),
    protected programId = TOKEN_PROGRAM_ID,
  ) {
    super(context)
    this.tokenEventParser = createTokenEventParser(
      this.fetchMintDAL,
      this.tokenEventDAL,
    )
    this.accountMints = new PendingWorkPool<MintAccount>({
      id: 'mintAccounts',
      interval: 0,
      chunkSize: 100,
      concurrency: 1,
      dal: this.fetchMintDAL,
      handleWork: this._handleMintAccounts.bind(this),
      checkComplete: () => false,
    })
  }

  async init(): Promise<void> {
    return
  }

  async onNewAccount(
    config: AccountIndexerConfigWithMeta<SPLTokenAccount>,
  ): Promise<void> {
    const { account, meta } = config

    if (
      meta.type === SPLTokenType.Mint ||
      meta.type === SPLTokenType.Account ||
      meta.type === SPLTokenType.AccountMint
    ) {
      const mint = meta.mint
      if (!this.mints[mint]) {
        this.mints[mint] = new Mint(
          mint,
          this.tokenEventDAL,
          this.balanceStateDAL,
          this.balanceHistoryDAL,
          this.accountMintDAL,
        )
      }
      await this.mints[mint].addAccount(account)
    }
    console.log('Account indexing', this.context.instanceName, account)
  }

  async getTimeSeriesStats(
    account: string,
    type: string,
    filters: AccountStatsFilters,
  ): Promise<any> {
    return {}
  }

  async getStats(account: string): Promise<any> {
    return {}
  }

  async updateStats(account: string, now: number): Promise<void> {
    console.log('', account)
  }

  async getTokenHoldings(
    account: string,
    filters: TokenHoldersFilters,
  ): Promise<SPLTokenHolding[]> {
    const mint = this.mints[account]
    if (!mint) return []
    return await mint.getTokenHoldings(filters)
  }

  protected async filterInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<InstructionContextV1[]> {
    return ixsContext.filter(({ ix }) => isParsableInstruction(ix))
  }

  protected async indexInstructions(
    ixsContext: InstructionContextV1[],
  ): Promise<void> {
    const parsedSPLTokenEvents: SPLTokenEvent[] = []
    const parsedLendingEvents: LendingEvent[] = []
    const works: PendingWork<MintAccount>[] = []
    const promises = ixsContext.map(async (ixCtx) => {
      const mintAccount = ixCtx.txContext.parserContext.account
      // handle instructions triggered by mint accounts
      if (this.mints[mintAccount]) {
        const work = this._handleMintAccountInstructions(ixCtx, mintAccount)
        if (work) works.push(work)
        return
      }
      // handle instructions triggered by token owners
      if (isSPLTokenInstruction(ixCtx.ix)) {
        const parsedIx = await this._handleSPLTokenInstruction(ixCtx)
        if (parsedIx) parsedSPLTokenEvents.push(parsedIx)
        return
      }
      // handle instructions triggered by lending programs
      if (isSPLLendingInstruction(ixCtx.ix)) {
        const parsedIx = await this.lendingEventParser.parse(ixCtx)
        if (parsedIx) parsedLendingEvents.push(parsedIx)
        return
      }
    })

    await Promise.all(promises)

    console.log(`indexing ${ixsContext.length} parsed ixs`)

    if (parsedSPLTokenEvents.length > 0) {
      await this.tokenEventDAL.save(parsedSPLTokenEvents)

      for (const parsedEvent of parsedSPLTokenEvents) {
        await this.dealWalletBalances(parsedEvent as SPLTokenEvent)
      }
    }

    if (parsedLendingEvents.length > 0) {
      await this.lendingEventDAL.save(parsedLendingEvents)

      // @todo: handle lending events with stats
      //for (const parsedEvent of parsedLendingEvents) {
      //  await this.dealLendingBalances(parsedEvent as LendingEvent)
      //}
    }
    if (works.length > 0) {
      await this.accountMints.addWork(works)
    }
  }

  private _handleMintAccountInstructions(ixCtx, account) {
    const parsedIx = this.mintParser.parse(ixCtx, account)
    if (!parsedIx) return
    if (parsedIx.type !== SPLTokenEventType.InitializeAccount) return
    return this._handleInitTokenAccount(parsedIx)
  }

  private _handleInitTokenAccount(parsedIx: SPLTokenEvent) {
    return {
      id: parsedIx.account,
      time: Date.now(),
      payload: {
        mint: parsedIx.mint,
        timestamp: parsedIx.timestamp,
        event: parsedIx,
      },
    }
  }

  private async _handleSPLTokenInstruction(ixCtx: InstructionContextV1) {
    const parsedIx = await this.tokenEventParser.parse(ixCtx)
    if (parsedIx?.type === SPLTokenEventType.CloseAccount) {
      await this._handleCloseTokenAccount(parsedIx)
    }
    return parsedIx
  }

  private async _handleCloseTokenAccount(parsedIx: SPLTokenEventCloseAccount) {
    const work = await this.fetchMintDAL.getFirstValueFromTo(
      [parsedIx.account],
      [parsedIx.account],
      { atomic: true },
    )
    if (work && parsedIx.timestamp >= work.payload.timestamp) {
      await this.accountMints.removeWork(work)
      const options = {
        account: parsedIx.account,
        index: {
          transactions: true,
          content: true,
        },
      }
      await this.context.apiClient.deleteAccount(options)
    }
  }

  /**
   * Fetch signatures from accounts.
   * @param works Txn signatures with extra properties as time and payload.
   */
  protected async _handleMintAccounts(
    works: PendingWork<MintAccount>[],
  ): Promise<void> {
    console.log(
      `Mint accounts | Start handling ${works.length} minted accounts`,
    )

    for (const work of works) {
      if (!work) continue

      const account = work.id
      const options = {
        account,
        meta: {
          address: account,
          type: SPLTokenType.AccountMint,
          mint: work.payload.mint,
        },
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          content: false,
        },
      }
      await this.context.apiClient.indexAccount(options)
    }
  }

  protected async dealWalletBalances(
    entity: SPLTokenEvent,
  ): Promise<SPLTokenHolding[]> {
    const accounts = getSPLTokenEventAccounts(entity)
    const entities = await Promise.all(
      accounts.map(async (account) => {
        const walletBalance = getWalletBalanceFromEvent(entity, account)
        let balance = await this.balanceHistoryDAL.getLastValueFromTo(
          [entity.mint, account, 0],
          [entity.mint, account, entity.timestamp],
        )
        if (!balance) {
          balance = {
            account,
            tokenMint: entity.mint,
            owner: entity.owner,
            balances: {
              wallet: walletBalance,
              solend: {
                deposited: '0',
                borrowed: '0',
              },
              port: {
                deposited: '0',
                borrowed: '0',
              },
              larix: {
                deposited: '0',
                borrowed: '0',
              },
              total: walletBalance,
            },
            timestamp: entity.timestamp,
          }
        }
        // @note: The total is the sum of the wallet balance and the deposited amounts. The borrowed amounts are subtracted.
        const { solend, port, larix } = balance.balances
        balance.balances.total = new BN(walletBalance)
          .add(new BN(solend.deposited))
          .add(new BN(port.deposited))
          .add(new BN(larix.deposited))
          .sub(new BN(solend.borrowed))
          .sub(new BN(port.borrowed))
          .sub(new BN(larix.borrowed))
          .toString()
        return balance
      }),
    )
    await this.balanceHistoryDAL.save(entities)
    await this.balanceStateDAL.save(entities)
    return entities
  }
}
