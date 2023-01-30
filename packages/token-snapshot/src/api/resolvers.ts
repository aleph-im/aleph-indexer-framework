import { SPLTokenHolding, SPLTokenInfo } from '../types.js'
import MainDomain from '../domain/main.js'

export type TokenFilters = {
  mint?: string
}

export type TokenEventsFilters = {
  mint: string
  account?: string
  types?: string[]
  startDate?: number
  endDate?: number
  limit?: number
  skip?: number
  reverse?: boolean
}

export type TokenHoldersFilters = {
  mint: string
  timestamp?: number
  limit?: number
  skip?: number
  reverse?: boolean
  gte?: string
  lte?: string
}

export class APIResolver {
  constructor(protected domain: MainDomain) {}

  async getTokens(mint?: string): Promise<SPLTokenInfo[]> {
    return await this.filterTokens({ mint })
  }

  async getTokenHoldings(
    filters: TokenHoldersFilters,
  ): Promise<SPLTokenHolding[]> {
    return await this.domain.getTokenHoldings(filters.mint, filters)
  }

  protected async filterTokens({
    mint,
  }: TokenFilters): Promise<SPLTokenInfo[]> {
    const domTokens = await this.domain.getTokens()

    const tokens =
      [mint] || Object.values(domTokens).map((token: any) => token.address)

    const result = (tokens as string[])
      .map((address) => domTokens[address])
      .filter((token) => !!token)

    return result
  }
}
