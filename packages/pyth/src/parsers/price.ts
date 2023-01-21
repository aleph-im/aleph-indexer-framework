import { Price, PythEvent } from '../types.js'
import { AccountDomain } from '../domain/account.js'

export class PriceParser {
  /**
   * Implements the Pyth price aggregation algorithm.
   * @param events - UpdPrice events occurring in a single slot.
   */
  parse(events: PythEvent[], accounts: Record<string, AccountDomain>): Price {
    const first = events[0]
    const accountData = accounts[first.accounts.priceAccount].info

    const id = `${first.accounts.priceAccount}:${first.timestamp}`
    const timestamp = events[0].timestamp

    const pricesAsc = events
      .flatMap((e) => [e.price, e.price + e.conf, e.price - e.conf])
      .sort((a, b) => a - b)

    const median = pricesAsc[Math.floor(pricesAsc.length / 2)]
    const percentile25 = pricesAsc[Math.floor(pricesAsc.length / 4)]
    const percentile75 = pricesAsc[Math.floor((pricesAsc.length * 3) / 4)]
    const conf = Math.max(
      Math.abs(median - percentile25),
      Math.abs(median - percentile75),
    )
    return {
      id,
      timestamp,
      price: median * Math.pow(10, accountData.data.exponent),
      confidence: conf * Math.pow(10, accountData.data.exponent),
      priceAccount: first.accounts.priceAccount,
      status: first.status,
    }
  }
}

export const priceParser = new PriceParser()
export default priceParser
