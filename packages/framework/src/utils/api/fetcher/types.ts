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
import { Blockchain, TimeInfo } from '../types.js'

export * from '../types.js'

export const FetcherState = new GraphQLObjectType({
  name: 'FetcherState',
  fields: {
    fetcher: { type: new GraphQLNonNull(GraphQLString) },
    blockchain: { type: new GraphQLNonNull(Blockchain) },
    pendingTransactions: { type: new GraphQLNonNull(GraphQLInt) },
    accountFetchers: { type: new GraphQLNonNull(GraphQLInt) },
    transactionThroughput: { type: new GraphQLNonNull(GraphQLInt) },
    data: { type: GraphQLJSONObject },
  },
})

export const FetcherStateList = new GraphQLList(FetcherState)

export const AccountFetcherState = new GraphQLObjectType({
  name: 'AccountFetcherState',
  fields: {
    fetcher: { type: new GraphQLNonNull(GraphQLString) },
    blockchain: { type: new GraphQLNonNull(Blockchain) },
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

export const AccountFetcherStateList = new GraphQLList(AccountFetcherState)

export const TransactionState = new GraphQLObjectType({
  name: 'TransactionState',
  fields: {
    fetcher: { type: new GraphQLNonNull(GraphQLString) },
    blockchain: { type: new GraphQLNonNull(Blockchain) },
    signature: { type: new GraphQLNonNull(GraphQLString) },
    isCached: { type: new GraphQLNonNull(GraphQLBoolean) },
    isPending: { type: new GraphQLNonNull(GraphQLBoolean) },
    pendingAddTime: { type: GraphQLString },
    pendingExecTime: { type: GraphQLString },
    data: { type: GraphQLJSONObject },
  },
})

export const TransactionStateList = new GraphQLList(TransactionState)

export { TimeInfo } from '../types.js'

export const types: GraphQLNamedType[] = [
  Blockchain,
  TimeInfo,
  FetcherState,
  TransactionState,
  AccountFetcherState,
]
