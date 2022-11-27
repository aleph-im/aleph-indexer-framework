import { Candle, Price } from '../../types.js'

export class CandleAggregator {
  aggregate(curr: Price | Candle, prev?: Candle): Candle {
    prev = this.prepareCandleItem(prev)
    return this.processPriceInfo(prev, curr)
  }

  // @note: We assume that curr data is sorted by time
  protected processPriceInfo(acc: Candle, curr: Price | Candle): Candle {
    if ((curr as Price).price) return this.processPriceData(acc, curr as Price)
    if ((curr as Candle).openPrice)
      return this.processCandle(acc, curr as Candle)
    return acc
  }

  protected processPriceData(acc: Candle, curr: Price): Candle {
    if (curr.price && curr.confidence) {
      if (acc.openPrice === 0) {
        acc.openPrice = curr.price
        acc.openConfidence = curr.confidence
        acc.openTimestamp = curr.timestamp
      }
      if (curr.price > acc.highPrice) {
        acc.highPrice = curr.price
        acc.highConfidence = curr.confidence
        acc.highTimestamp = curr.timestamp
      }
      if (curr.price < acc.lowPrice) {
        acc.lowPrice = curr.price
        acc.lowConfidence = curr.confidence
        acc.lowTimestamp = curr.timestamp
      }
      acc.closePrice = curr.price
      acc.closeConfidence = curr.confidence
      acc.closeTimestamp = curr.timestamp
    }

    return acc
  }

  protected processCandle(acc: Candle, curr: Candle): Candle {
    if (acc.openPrice === 0) {
      acc.openPrice = curr.openPrice
      acc.openConfidence = curr.openConfidence
      acc.openTimestamp = curr.openTimestamp
    }
    if (curr.highPrice > acc.highPrice) {
      acc.highPrice = curr.highPrice
      acc.highConfidence = curr.highConfidence
      acc.highTimestamp = curr.highTimestamp
    }
    if (curr.lowPrice < acc.lowPrice) {
      acc.lowPrice = curr.lowPrice
      acc.lowConfidence = curr.lowConfidence
      acc.lowTimestamp = curr.lowTimestamp
    }
    acc.closePrice = curr.closePrice
    acc.closeConfidence = curr.closeConfidence
    acc.closeTimestamp = curr.closeTimestamp

    return acc
  }

  protected prepareCandleItem(prev?: Candle): Candle {
    prev = prev || {
      openPrice: 0,
      openConfidence: 0,
      openTimestamp: 0,
      highPrice: 0,
      highConfidence: 0,
      highTimestamp: 0,
      lowPrice: Number.MAX_VALUE,
      lowConfidence: 0,
      lowTimestamp: 0,
      closePrice: 0,
      closeConfidence: 0,
      closeTimestamp: 0,
    }

    return prev
  }
}

export const pythCandleAggregator = new CandleAggregator()
export default pythCandleAggregator
