import {
  AccountIndexerRequestArgs,
  Blockchain,
  IndexerMainDomain,
  IndexerMainDomainContext,
  IndexerMainDomainWithDiscovery,
} from '@aleph-indexer/framework'
import { getTokenByAddress, getTokenMintByAccount, solanaPrivateRPCRoundRobin } from '@aleph-indexer/solana'
import { SPLTokenHolding, SPLTokenInfo, SPLTokenType } from '../types.js'
import { discoveryFn } from '../utils/discovery.js'
import { TokenHoldersFilters } from './types.js'
import { TOKEN_PROGRAM_ID } from '../constants.js'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery
{
  protected tokens: Record<string, SPLTokenInfo> = {}

  constructor(protected context: IndexerMainDomainContext) {
    super(context, {})
  }

  async discoverAccounts(): Promise<AccountIndexerRequestArgs[]> {
    const init = {
      account: '',
      index: {
        transactions: {
          chunkDelay: 0,
          chunkTimeframe: 1000 * 60 * 60 * 24,
        },
        content: false,
      },
      blockchainId: Blockchain.Solana,
    }
    return [init]
  }

  async init(...args: unknown[]): Promise<void> {
    await super.init(...args)
    const { accounts, mints } = await discoveryFn()

    await Promise.all(
      accounts.map(async (account: string) => {
        const connection = solanaPrivateRPCRoundRobin.getClient()
        const mint = await getTokenMintByAccount(
          account,
          connection.getConnection(),
        )
        await this.addToken(mint)

        const options = {
          account,
          meta: { type: SPLTokenType.Account, mint: mint },
          index: {
            transactions: {
              chunkDelay: 0,
              chunkTimeframe: 1000 * 60 * 60 * 24,
            },
            content: false,
          },
        }
        await this.context.apiClient.useBlockchain(Blockchain.Solana).indexAccount(options)
        this.accounts[Blockchain.Solana].add(account)
      }),
    )
    await Promise.all(
      mints.map(async (mint: string) => {
        await this.addToken(mint)
        const options = {
          account: mint,
          meta: { type: SPLTokenType.Mint, mint },
          index: {
            transactions: {
              chunkDelay: 0,
              chunkTimeframe: 1000 * 60 * 60 * 24,
            },
            content: false,
          },
        }
        await this.context.apiClient.useBlockchain(Blockchain.Solana).indexAccount(options)
        this.accounts[Blockchain.Solana].add(mint)
      }),
    )
  }

  async getTokens(): Promise<Record<string, SPLTokenInfo>> {
    return this.tokens
  }

  async getTokenHoldings(
    account: string,
    filters: TokenHoldersFilters,
  ): Promise<SPLTokenHolding[]> {
    return (await this.context.apiClient.invokeDomainMethod({
      account,
      args: [filters],
      method: 'getTokenHoldings',
    })) as SPLTokenHolding[]
  }

  protected async addToken(mint: string): Promise<void> {
    const connection = solanaPrivateRPCRoundRobin.getClient()
    const tokenInfo = await getTokenByAddress(
      mint,
      connection.getConnection(),
    )

    if (!tokenInfo) return

    const entity: SPLTokenInfo = {
      name: tokenInfo.symbol,
      address: mint,
      programId: TOKEN_PROGRAM_ID,
      tokenInfo,
    }

    this.tokens[mint] = entity
  }
}
