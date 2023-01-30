/**
 * Basic indexer GraphQL types. All fields should be self-explanatory.
 */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql'
import { GraphQLJSONObject } from '@aleph-indexer/core'
import { TimeFrame as TF } from '../../time.js'
import { Blockchain, TimeInfo, EntityType } from '../types.js'
import { EntityRequestType as TRT } from '../../../services/indexer/src/dal/entityRequest.js'

export * from '../types.js'

// State

export const AccountEntityIndexerState = new GraphQLObjectType({
  name: 'AccountEntityState',
  fields: {
    blockchain: { type: new GraphQLNonNull(Blockchain) },
    type: { type: new GraphQLNonNull(EntityType) },
    indexer: { type: new GraphQLNonNull(GraphQLString) },
    account: { type: new GraphQLNonNull(GraphQLString) },
    accurate: { type: new GraphQLNonNull(GraphQLBoolean) },
    progress: { type: new GraphQLNonNull(GraphQLFloat) },
    pending: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    processed: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  },
})

export const AccountEntityIndexerStateList = new GraphQLList(
  AccountEntityIndexerState,
)

// Private API

export const EntityRequestType = new GraphQLEnumType({
  name: 'EntityRequestType',
  values: {
    ByDateRange: { value: TRT.ByDateRange },
    BySignatures: { value: TRT.ById },
  },
})

export const EntityPendingRequest = new GraphQLObjectType({
  name: 'EntityPendingRequest',
  fields: {
    indexer: { type: new GraphQLNonNull(GraphQLString) },
    nonce: { type: new GraphQLNonNull(GraphQLFloat) },
    type: { type: new GraphQLNonNull(EntityRequestType) },
    count: { type: GraphQLInt },
    complete: { type: GraphQLBoolean },
    params: { type: GraphQLJSONObject },
  },
})

export const EntityPendingRequestList = new GraphQLList(EntityPendingRequest)

// Stats

export const TimeFrame = new GraphQLEnumType({
  name: 'TimeFrame',
  values: {
    Hour: { value: TF.Hour },
    Day: { value: TF.Day },
    Week: { value: TF.Week },
    Month: { value: TF.Month },
    Year: { value: TF.Year },
    All: { value: TF.All },
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
  Blockchain,
  TimeInfo,
  AccountEntityIndexerState,
  TimeFrame,
  EntityRequestType,
  EntityPendingRequest,
]
