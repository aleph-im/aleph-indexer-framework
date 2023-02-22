import { Price, PythEvent, PythAccountInfo } from '../types.js'

export class PriceParser {
  /**
   * Implements the Pyth price aggregation algorithm.
   * @param events - UpdPrice events occurring in a single slot.
   * @param info - Price account info.
   */
  parse(events: PythEvent[], info: PythAccountInfo): Price {
    const id = `${info.address}:${events[0].timestamp}`
    const timestamp = events[0].timestamp
    const pubSlot = events[0].pubSlot

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

    console.log('price account with parsed prices:', info.address)
    return {
      id,
      timestamp,
      pubSlot: pubSlot,
      price: median * Math.pow(10, info.data.exponent),
      confidence: conf * Math.pow(10, info.data.exponent),
      priceAccount: info.address,
      status: info.data.status,
    }
  }
}

export const priceParser = new PriceParser()
export default priceParser
