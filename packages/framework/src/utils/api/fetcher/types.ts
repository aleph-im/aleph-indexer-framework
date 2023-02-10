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
import { GraphQLBlockchain, GraphQLEntityType, GraphQLTimeInfo } from '../types.js'

export * from '../types.js'

export const FetcherEntityState = new GraphQLObjectType({
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

export const FetcherEntityStateList = new GraphQLList(FetcherEntityState)

export const AccountEntityFetcherState = new GraphQLObjectType({
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

export const AccountEntityFetcherStateList = new GraphQLList(
  AccountEntityFetcherState,
)

export const EntityState = new GraphQLObjectType({
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

export const EntityStateList = new GraphQLList(EntityState)

export { GraphQLTimeInfo as TimeInfo } from '../types.js'

export const types: GraphQLNamedType[] = [
  GraphQLBlockchain,
  GraphQLTimeInfo,
  FetcherEntityState,
  EntityState,
  AccountEntityFetcherState,
]
