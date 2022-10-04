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
import { TransactionRequestType as TRT } from '../../../services/indexer/src/dal/transactionRequest.js'
import {GraphQLDuration, GraphQLJSONObject} from "graphql-scalars";

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
      timeFrame: { type: new GraphQLNonNull(GraphQLDuration) },
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

export const types: GraphQLNamedType[] = [
  AccountState,
  GraphQLDuration,
  TransactionRequestType,
  TransactionRequest,
]
