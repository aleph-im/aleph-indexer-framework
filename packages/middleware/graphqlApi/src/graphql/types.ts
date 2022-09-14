import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql'

// ------------------- TRADING PAIRS --------------------------

const TradingPairItem = new GraphQLObjectType({
  name: 'TradingPair',
  fields: {
    tradingPairs: { type: new GraphQLNonNull(GraphQLString) },
    lastPrice: { type: new GraphQLNonNull(GraphQLFloat) },
    lowestAsk: { type: new GraphQLNonNull(GraphQLFloat) },
    highestBid: { type: new GraphQLNonNull(GraphQLFloat) },
    baseVolume: { type: new GraphQLNonNull(GraphQLFloat) },
    quoteVolume: { type: new GraphQLNonNull(GraphQLFloat) },
    priceChangePercent24h: { type: new GraphQLNonNull(GraphQLFloat) },
    highestPrice24h: { type: new GraphQLNonNull(GraphQLFloat) },
    lowestPrice24h: { type: new GraphQLNonNull(GraphQLFloat) },
  },
})

export const Summary = new GraphQLList(TradingPairItem)

// ------------------- TICKER --------------------------

const TickerItem = new GraphQLObjectType({
  name: 'Ticker',
  fields: {
    tradingPairs: { type: new GraphQLNonNull(GraphQLString) },
    lastPrice: { type: new GraphQLNonNull(GraphQLFloat) },
    lowestAsk: { type: new GraphQLNonNull(GraphQLFloat) },
    highestBid: { type: new GraphQLNonNull(GraphQLFloat) },
    baseVolume: { type: new GraphQLNonNull(GraphQLFloat) },
    quoteVolume: { type: new GraphQLNonNull(GraphQLFloat) },
    priceChangePercent24h: { type: new GraphQLNonNull(GraphQLFloat) },
    highestPrice24h: { type: new GraphQLNonNull(GraphQLFloat) },
    lowestPrice24h: { type: new GraphQLNonNull(GraphQLFloat) },
  },
})

export const Tickers = new GraphQLList(TickerItem)

// ------------------- MARKET PAIR --------------------------

const OrderBookMarketPairAskItem = GraphQLList(GraphQLNonNull(GraphQLFloat))
const OrderBookMarketPairBidItem = GraphQLList(GraphQLNonNull(GraphQLFloat))

const OrderBookMarketPairItem = new GraphQLObjectType({
  name: 'OrderBookMarketPair',
  fields: {
    timestamp: { type: new GraphQLNonNull(GraphQLInt) },
    bids: { type: new GraphQLList(OrderBookMarketPairAskItem) },
    asks: { type: new GraphQLList(OrderBookMarketPairBidItem) },
  },
})

export const OrderBooks = new GraphQLList(OrderBookMarketPairItem)

// ------------------- MARKET PAIR TRADE --------------------------

const TradeMarketPairItem = new GraphQLObjectType({
  name: 'TradeMarketPair',
  fields: {
    tradeId: { type: new GraphQLNonNull(GraphQLString) },
    price: { type: new GraphQLNonNull(GraphQLFloat) },
    baseVolume: { type: new GraphQLNonNull(GraphQLFloat) },
    quoteVolume: { type: new GraphQLNonNull(GraphQLFloat) },
    timestamp: { type: new GraphQLNonNull(GraphQLInt) },
    type: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const Trades = new GraphQLList(TradeMarketPairItem)

// ------------------- EVENTS --------------------------

const Event = new GraphQLObjectType({
  name: 'Event',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const Events = new GraphQLList(Event)
