// ----------- TRADING PAIR ----------

export type TradingPair = {
  tradingPairs: string
  lastPrice: number
  lowestAsk: number
  highestBid: number
  baseVolume: number
  quoteVolume: number
  priceChangePercent24h: number
  highestPrice24h: number
  lowestPrice24h: number
}

// ----------- TICKER ----------

export type TickerDetail = {
  baseId: string
  quoteId: string
  lastPrice: number
  baseVolume: number
  quoteVolume: number
  isFrozen: number
}

// ----------- ORDERBOOK ----------

export type OrderMarketPair = {
  timestamp: number
  bids: OrderMarketPairBid[]
  asks: OrderMarketPairAsk[]
}

export type OrderMarketPairBid = [number, number]

export type OrderMarketPairAsk = [number, number]

// ----------- TRADES ----------

export type TradeMarketPair = {
  tradeId: string
  price: number
  baseVolume: number
  quoteVolume: number
  timestamp: number
  type: string
}

// ----------- EVENTS ----------

export type Event = {
  id: string
}
