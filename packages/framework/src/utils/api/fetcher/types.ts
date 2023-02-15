/**
 * Basic fetcher GraphQL types. All fields should be self-explanatory.
 */
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import {
  GraphQLBlockchain,
  GraphQLEntityType,
  GraphQLTimeInfo,
} from '../types.js'

export * from '../types.js'

export const GraphQLFetcherEntityState = new GraphQLObjectType({
  name: 'FetcherEntityState',
  fields: {
    fetcher: { type: new GraphQLNonNull(GraphQLString) },
    blockchain: { type: new GraphQLNonNull(GraphQLBlockchain) },
    type: { type: new GraphQLNonNull(GraphQLEntityType) },
    pendingTransactions: { type: new GraphQLNonNull(GraphQLInt) },
    accountFetchers: { type: new GraphQLNonNull(GraphQLInt) },
    transactionThroughput: { type: new GraphQLNonNull(GraphQLInt) },
    data: { type: GraphQLJSONObject },
  },
})

export const GraphQLFetcherEntityStateList = new GraphQLList(
  GraphQLFetcherEntityState,
)

export const GraphQLAccountEntityFetcherState = new GraphQLObjectType({
  name: 'AccountEntityFetcherState',
  fields: {
    fetcher: { type: new GraphQLNonNull(GraphQLString) },
    blockchain: { type: new GraphQLNonNull(GraphQLBlockchain) },
    type: { type: new GraphQLNonNull(GraphQLEntityType) },
    account: { type: new GraphQLNonNull(GraphQLString) },
    firstTimestamp: { type: GraphQLFloat },
    lastTimestamp: { type: GraphQLFloat },
    firstSlot: { type: GraphQLFloat },
    lastSlot: { type: GraphQLFloat },
    firstSignature: { type: GraphQLString },
    lastSignature: { type: GraphQLString },
    completeHistory: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
})

export const GraphQLAccountEntityFetcherStateList = new GraphQLList(
  GraphQLAccountEntityFetcherState,
)

export const GraphQLEntityState = new GraphQLObjectType({
  name: 'EntityState',
  fields: {
    fetcher: { type: new GraphQLNonNull(GraphQLString) },
    blockchain: { type: new GraphQLNonNull(GraphQLBlockchain) },
    type: { type: new GraphQLNonNull(GraphQLEntityType) },
    signature: { type: new GraphQLNonNull(GraphQLString) },
    isCached: { type: new GraphQLNonNull(GraphQLBoolean) },
    isPending: { type: new GraphQLNonNull(GraphQLBoolean) },
    pendingAddTime: { type: GraphQLString },
    pendingExecTime: { type: GraphQLString },
    data: { type: GraphQLJSONObject },
  },
})

export const GraphQLEntityStateList = new GraphQLList(GraphQLEntityState)

export { GraphQLTimeInfo as TimeInfo } from '../types.js'

export const fetcherGrapQLTypes: GraphQLNamedType[] = [
  GraphQLBlockchain,
  GraphQLTimeInfo,
  GraphQLFetcherEntityState,
  GraphQLEntityState,
  GraphQLAccountEntityFetcherState,
]
