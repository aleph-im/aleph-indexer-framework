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
import {
  GraphQLBlockchain,
  GraphQLTimeInfo,
  GraphQLEntityType,
} from '../types.js'
import { EntityRequestType as TRT } from '../../../services/indexer/src/dal/entityRequest.js'

export * from '../types.js'

// State

export const GraphQLAccountEntityIndexerState = new GraphQLObjectType({
  name: 'AccountEntityState',
  fields: {
    blockchain: { type: new GraphQLNonNull(GraphQLBlockchain) },
    type: { type: new GraphQLNonNull(GraphQLEntityType) },
    indexer: { type: new GraphQLNonNull(GraphQLString) },
    account: { type: new GraphQLNonNull(GraphQLString) },
    completeHistory: { type: new GraphQLNonNull(GraphQLBoolean) },
    progress: { type: new GraphQLNonNull(GraphQLFloat) },
    pending: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    processed: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  },
})

export const GraphQLAccountEntityIndexerStateList = new GraphQLList(
  GraphQLAccountEntityIndexerState,
)

// Private API

export const GraphQLEntityRequestType = new GraphQLEnumType({
  name: 'EntityRequestType',
  values: {
    ByDateRange: { value: TRT.ByDateRange },
    BySignatures: { value: TRT.ById },
  },
})

export const GraphQLEntityPendingRequest = new GraphQLObjectType({
  name: 'EntityPendingRequest',
  fields: {
    indexer: { type: new GraphQLNonNull(GraphQLString) },
    nonce: { type: new GraphQLNonNull(GraphQLFloat) },
    type: { type: new GraphQLNonNull(GraphQLEntityRequestType) },
    count: { type: GraphQLInt },
    complete: { type: GraphQLBoolean },
    params: { type: GraphQLJSONObject },
  },
})

export const GraphQLEntityPendingRequestList = new GraphQLList(
  GraphQLEntityPendingRequest,
)

// Stats

export const GraphQLTimeFrame = new GraphQLEnumType({
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
  const GraphQLTimeSeriesItemValue = customTimeSeriesTypesMap
    ? new GraphQLUnionType({
        name: 'TimeSeriesItemUnion',
        types: Object.values(customTimeSeriesTypesMap),
        resolveType(value) {
          return customTimeSeriesTypesMap[value.type]
        },
      })
    : GraphQLJSONObject

  const GraphQLAccountStats = new GraphQLObjectType({
    name: 'AccountStats',
    fields: {
      account: { type: new GraphQLNonNull(GraphQLString) },
      stats: {
        type: customStatsType ? customStatsType : GraphQLJSONObject,
      },
    },
  })

  const GraphQLTimeSeriesItem = new GraphQLObjectType({
    name: 'TimeSeriesItem',
    fields: {
      date: { type: new GraphQLNonNull(GraphQLString) },
      value: { type: new GraphQLNonNull(GraphQLTimeSeriesItemValue) },
    },
  })

  const GraphQLTimeSeries = new GraphQLList(GraphQLTimeSeriesItem)

  const GraphQLAccountTimeSeriesStats = new GraphQLObjectType({
    name: 'AccountTimeSeriesStats',
    fields: {
      account: { type: new GraphQLNonNull(GraphQLString) },
      type: { type: new GraphQLNonNull(GraphQLString) },
      timeFrame: { type: new GraphQLNonNull(GraphQLTimeFrame) },
      series: { type: GraphQLTimeSeries },
    },
  })

  const GraphQLAccountTimeSeriesStatsList = new GraphQLList(
    GraphQLAccountTimeSeriesStats,
  )
  const GraphQLAccountStatsList = new GraphQLList(GraphQLAccountStats)

  const types: GraphQLNamedType[] = [
    GraphQLTimeSeriesItemValue,
    GraphQLAccountStats,
    GraphQLTimeSeriesItem,
    GraphQLAccountTimeSeriesStats,
  ]

  return {
    AccountTimeSeriesStatsList: GraphQLAccountTimeSeriesStatsList,
    AccountStatsList: GraphQLAccountStatsList,
    types,
  }
}

export { GraphQLTimeInfo as TimeInfo } from '../types.js'

export const indexerGraphQLTypes: GraphQLNamedType[] = [
  GraphQLBlockchain,
  GraphQLTimeInfo,
  GraphQLAccountEntityIndexerState,
  GraphQLTimeFrame,
  GraphQLEntityRequestType,
  GraphQLEntityPendingRequest,
]
