import { GraphQLBigNumber } from '@aleph-indexer/core'
import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
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
    id: { type: new GraphQLNonNull(GraphQLString) },
    timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
    priceAccount: { type: new GraphQLNonNull(GraphQLString) },
    price: { type: new GraphQLNonNull(GraphQLFloat) },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    status: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const Prices = new GraphQLList(Price)

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

export const Candles = new GraphQLList(Candle)

export const PythAccountStats = new GraphQLObjectType({
  name: 'PythAccountStats',
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

// ------------------- TYPES ---------------------------

export const AccountHeader = new GraphQLObjectType({
  name: 'AccountHeader',
  fields: {
    magic: { type: new GraphQLNonNull(GraphQLInt) },
    version: { type: new GraphQLNonNull(GraphQLInt) },
    type: { type: new GraphQLNonNull(GraphQLInt) },
    size: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const PriceEma = new GraphQLObjectType({
  name: 'PriceEma',
  fields: {
    valueComponent: { type: new GraphQLNonNull(GraphQLBigNumber) },
    value: { type: new GraphQLNonNull(GraphQLBigNumber) },
    numerator: { type: new GraphQLNonNull(GraphQLBigNumber) },
    denominator: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const PriceInfo = new GraphQLObjectType({
  name: 'PriceInfo',
  fields: {
    priceComponent: { type: new GraphQLNonNull(GraphQLBigNumber) },
    price: { type: GraphQLBigNumber },
    confidenceComponent: { type: new GraphQLNonNull(GraphQLBigNumber) },
    confidence: { type: GraphQLBigNumber },
    status: { type: new GraphQLNonNull(GraphQLInt) },
    corporateAction: { type: new GraphQLNonNull(GraphQLInt) },
    publishSlot: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const PriceComponent = new GraphQLObjectType({
  name: 'PriceComponent',
  fields: {
    publisher: { type: GraphQLString },
    aggregate: { type: new GraphQLNonNull(PriceInfo) },
    latest: { type: new GraphQLNonNull(PriceInfo) },
  },
})

export const Product = new GraphQLObjectType({
  name: 'Product',
  fields: {
    symbol: { type: new GraphQLNonNull(GraphQLString) },
    asset_type: { type: new GraphQLNonNull(GraphQLString) },
    quote_currency: { type: new GraphQLNonNull(GraphQLString) },
    tenor: { type: GraphQLString },
    price_account: { type: new GraphQLNonNull(GraphQLString) },
    index: { type: GraphQLString },
  },
})

// ------------------- ACCOUNTS ---------------------------

export const ParsedAccountsData = new GraphQLObjectType({
  name: 'ParsedAccountsData',
  fields: {
    header: { type: new GraphQLNonNull(AccountHeader) },
    priceType: { type: new GraphQLNonNull(GraphQLInt) },
    exponent: { type: new GraphQLNonNull(GraphQLInt) },
    numComponentPrices: { type: new GraphQLNonNull(GraphQLInt) },
    numQuoters: { type: new GraphQLNonNull(GraphQLInt) },
    lastSlot: { type: new GraphQLNonNull(GraphQLBigNumber) },
    validSlot: { type: new GraphQLNonNull(GraphQLBigNumber) },
    emaPrice: { type: new GraphQLNonNull(PriceEma) },
    emaConfidence: { type: new GraphQLNonNull(PriceEma) },
    timestamp: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minPublishers: { type: new GraphQLNonNull(GraphQLInt) },
    drv2: { type: new GraphQLNonNull(GraphQLInt) },
    drv3: { type: new GraphQLNonNull(GraphQLInt) },
    drv4: { type: new GraphQLNonNull(GraphQLInt) },
    productAccountKey: { type: new GraphQLNonNull(GraphQLString) },
    nextPriceAccountKey: { type: GraphQLString },
    previousSlot: { type: new GraphQLNonNull(GraphQLBigNumber) },
    previousPriceComponent: { type: new GraphQLNonNull(GraphQLBigNumber) },
    previousPrice: { type: new GraphQLNonNull(GraphQLBigNumber) },
    previousConfidenceComponent: { type: new GraphQLNonNull(GraphQLBigNumber) },
    previousConfidence: { type: new GraphQLNonNull(GraphQLBigNumber) },
    previousTimestamp: { type: new GraphQLNonNull(GraphQLBigNumber) },
    priceComponents: { type: new GraphQLNonNull(GraphQLList(PriceComponent)) },
    aggregate: { type: new GraphQLNonNull(PriceInfo) },
    price: { type: GraphQLInt },
    confidence: { type: GraphQLInt },
    status: { type: new GraphQLNonNull(GraphQLInt) },

    priceAccountKey: { type: new GraphQLNonNull(GraphQLString) },
    product: { type: new GraphQLNonNull(Product) },
  },
})

export const PythOracleAccountsInfo = new GraphQLObjectType({
  name: 'PythOracleAccountsInfo',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    programId: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    data: { type: new GraphQLNonNull(ParsedAccountsData) },
  },
})

export const AccountsInfo = new GraphQLList(PythOracleAccountsInfo)
