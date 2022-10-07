import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { TIME_FRAMES } from '../constants.js'

export const CandleInterval = new GraphQLEnumType({
  name: 'CandleInterval',
  values: Object.fromEntries(TIME_FRAMES.map((value) => [value, { value }])),
})

export const PriceStatus = new GraphQLEnumType({
  name: 'PriceStatus',
  values: {
    Unknown: { value: 'Unknown' },
    Trading: { value: 'Trading' },
    Halted: { value: 'Halted' },
    Auction: { value: 'Auction' },
  },
})

export const AssetType = new GraphQLEnumType({
  name: 'AssetType',
  values: {
    Crypto: { value: 'Crypto' },
    Equity: { value: 'Equity' },
    FX: { value: 'FX' },
    Metal: { value: 'Metal' },
  },
})

export const Price = new GraphQLObjectType({
  name: 'Price',
  fields: {
    timestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
    price: { type: new GraphQLNonNull(GraphQLFloat) },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    status: { type: new GraphQLNonNull(PriceStatus) },
  },
})

export const Candle = new GraphQLObjectType({
  name: 'Candle',
  fields: {
    openPrice: { type: new GraphQLNonNull(GraphQLFloat) },
    highPrice: { type: new GraphQLNonNull(GraphQLFloat) },
    lowPrice: { type: new GraphQLNonNull(GraphQLFloat) },
    closePrice: { type: new GraphQLNonNull(GraphQLFloat) },
    openConfidence: { type: new GraphQLNonNull(GraphQLFloat) },
    highConfidence: { type: new GraphQLNonNull(GraphQLFloat) },
    lowConfidence: { type: new GraphQLNonNull(GraphQLFloat) },
    closeConfidence: { type: new GraphQLNonNull(GraphQLFloat) },
    openTimestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
    highTimestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
    lowTimestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
    closeTimestamp: { type: new GraphQLNonNull(GraphQLDateTime) },
  },
})

export const DataFeedInfo = new GraphQLObjectType({
  name: 'DataFeedInfo',
  fields: {
    address: { type: GraphQLNonNull(GraphQLString) },
    symbol: { type: GraphQLNonNull(GraphQLString) },
    assetType: { type: GraphQLNonNull(AssetType) },
    quoteCurrency: { type: GraphQLNonNull(GraphQLString) },
    tenor: { type: GraphQLNonNull(GraphQLString) },
  },
})

export const DataFeedStats = new GraphQLObjectType({
  name: 'DataFeedStats',
  fields: {
    address: { type: GraphQLNonNull(GraphQLString) },
    last1h: { type: GraphQLNonNull(Candle) },
    last24h: { type: GraphQLNonNull(Candle) },
    last7d: { type: GraphQLNonNull(Candle) },
    last1m: { type: GraphQLNonNull(Candle) },
    lastYear: { type: GraphQLNonNull(Candle) },
    total: { type: GraphQLNonNull(Candle) },
    markPrice: { type: GraphQLNonNull(GraphQLFloat) },
    confidence: { type: GraphQLNonNull(GraphQLFloat) },
  },
})

export const GlobalStats = new GraphQLObjectType({
  name: 'GlobalStats',
  fields: {
    totalDataFeeds: { type: GraphQLNonNull(GraphQLInt) },
    totalCryptoDataFeeds: { type: GraphQLNonNull(GraphQLInt) },
    totalEquityDataFeeds: { type: GraphQLNonNull(GraphQLInt) },
    totalFXDataFeeds: { type: GraphQLNonNull(GraphQLInt) },
    totalMetalDataFeeds: { type: GraphQLNonNull(GraphQLInt) },
  },
})
