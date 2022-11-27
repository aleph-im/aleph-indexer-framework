import { Price, UpdatePriceEvent } from '../types.js'
import { PriceAccounts } from '../utils/pyth-sdk.js'

export class PriceParser {
  /**
   * Implements the Pyth price aggregation algorithm.
   * @param events - UpdPrice events occurring in a single slot.
   */
  parse(events: UpdatePriceEvent[]): Price {
    const first = events[0]
    const accountData = PriceAccounts[first.accounts.price_accountAccount]
    const id = `${first.accounts.price_accountAccount}:${first.timestamp}`
    const timestamp = events[0].timestamp

    const pricesAsc = events
      .flatMap((e) => [
        e.price_.toNumber(),
        e.price_.add(e.conf_).toNumber(),
        e.price_.sub(e.conf_).toNumber(),
      ])
      .sort((a, b) => a - b)
    const median = pricesAsc[Math.floor(pricesAsc.length / 2)]
    const percentile_25 = pricesAsc[Math.floor(pricesAsc.length / 4)]
    const percentile_75 = pricesAsc[Math.floor((pricesAsc.length * 3) / 4)]
    const conf = Math.max(
      Math.abs(median - percentile_25),
      Math.abs(median - percentile_75),
    )

    return {
      id,
      timestamp,
      price: median * Math.pow(10, accountData.exponent),
      confidence: conf * Math.pow(10, accountData.exponent),
      priceAccount: first.accounts.price_accountAccount,
      status: first.status_,
    }
  }
}

export const priceParser = new PriceParser()
export default priceParser
