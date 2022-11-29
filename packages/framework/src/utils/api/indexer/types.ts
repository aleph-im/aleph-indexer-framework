/**
 * Basic indexer GraphQL types. All fields should be self-explanatory.
 */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql'
import { GraphQLJSONObject } from '@aleph-indexer/core'
import { TimeInfo } from '../types.js'
import { TransactionRequestType as TRT } from '../../../services/indexer/src/dal/transactionRequest.js'
import {Duration} from "luxon";
import {MAX_TIMEFRAME} from "../../time.js";

// State

export const AccountState = new GraphQLObjectType({
  name: 'AccountState',
  fields: {
    indexer: { type: new GraphQLNonNull(GraphQLString) },
    account: { type: new GraphQLNonNull(GraphQLString) },
    accurate: { type: new GraphQLNonNull(GraphQLBoolean) },
    progress: { type: new GraphQLNonNull(GraphQLFloat) },
    pending: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    processed: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  },
})

export const AccountStateList = new GraphQLList(AccountState)

// Private API

export const TransactionRequestType = new GraphQLEnumType({
  name: 'TransactionRequestType',
  values: {
    ByDateRange: { value: TRT.ByDateRange },
    BySlotRange: { value: TRT.BySlotRange },
    BySignatures: { value: TRT.BySignatures },
  },
})

export const TransactionRequest = new GraphQLObjectType({
  name: 'TransactionRequest',
  fields: {
    indexer: { type: new GraphQLNonNull(GraphQLString) },
    nonce: { type: new GraphQLNonNull(GraphQLFloat) },
    type: { type: new GraphQLNonNull(TransactionRequestType) },
    complete: { type: GraphQLBoolean },
    params: { type: GraphQLJSONObject },
  },
})

export const TransactionRequestList = new GraphQLList(TransactionRequest)

// Stats

export const TimeFrame = new GraphQLEnumType({
  name: 'TimeFrame',
  values: {
    Hour: { value: Duration.fromDurationLike({hour: 1}).toMillis() },
    Day: { value: Duration.fromDurationLike({day: 1}).toMillis() },
    Week: { value: Duration.fromDurationLike({week: 1}).toMillis() },
    Month: { value: Duration.fromDurationLike({month: 1}).toMillis() },
    Year: { value: Duration.fromDurationLike({year: 1}).toMillis() },
    All: { value: MAX_TIMEFRAME.toMillis() },
  },
})

export function getAccountTimeSeriesStatsType(
  customTimeSeriesTypesMap?: Record<string, GraphQLObjectType>,
  customStatsType?: GraphQLObjectType,
): {
  AccountTimeSeriesStatsList: GraphQLList<GraphQLType>
  AccountStatsList: GraphQLList<GraphQLType>
  types: GraphQLNamedType[]
} {
  const TimeSeriesItemValue = customTimeSeriesTypesMap
    ? new GraphQLUnionType({
        name: 'TimeSeriesItemUnion',
        types: Object.values(customTimeSeriesTypesMap),
        resolveType(value) {
          return customTimeSeriesTypesMap[value.type]
        },
      })
    : GraphQLJSONObject

  const AccountStats = new GraphQLObjectType({
    name: 'AccountStats',
    fields: {
      account: { type: new GraphQLNonNull(GraphQLString) },
      stats: {
        type: customStatsType ? customStatsType : GraphQLJSONObject,
      },
    },
  })

  const TimeSeriesItem = new GraphQLObjectType({
    name: 'TimeSeriesItem',
    fields: {
      date: { type: new GraphQLNonNull(GraphQLString) },
      value: { type: new GraphQLNonNull(TimeSeriesItemValue) },
    },
  })

  const TimeSeries = new GraphQLList(TimeSeriesItem)

  const AccountTimeSeriesStats = new GraphQLObjectType({
    name: 'AccountTimeSeriesStats',
    fields: {
      account: { type: new GraphQLNonNull(GraphQLString) },
      type: { type: new GraphQLNonNull(GraphQLString) },
      timeFrame: { type: new GraphQLNonNull(TimeFrame) },
      series: { type: TimeSeries },
    },
  })

  const AccountTimeSeriesStatsList = new GraphQLList(AccountTimeSeriesStats)
  const AccountStatsList = new GraphQLList(AccountStats)

  const types: GraphQLNamedType[] = [
    TimeSeriesItemValue,
    AccountStats,
    TimeSeriesItem,
    AccountTimeSeriesStats,
  ]

  return {
    AccountTimeSeriesStatsList,
    AccountStatsList,
    types,
  }
}

export { TimeInfo } from '../types.js'

export const types: GraphQLNamedType[] = [
  TimeInfo,
  AccountState,
  TimeFrame,
  TransactionRequestType,
  TransactionRequest,
]
