import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'
import { FetcherMainDomain } from '../../domain/index.js'
import * as Types from './types.js'
import {GraphQLDateTime} from "graphql-scalars";

/**
 * Combines the fetcher's domain class with the fetcher's API.
 */
export class FetcherAPISchema extends GraphQLSchema {
  constructor(protected domain: FetcherMainDomain) {
    super({
      types: Types.types,
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          time: {
            type: GraphQLDateTime,
            args: {},
            resolve: () => new Date().toISOString(),
          },

          fetcherState: {
            type: Types.FetcherStateList,
            args: {
              fetcher: {
                type: new GraphQLList(GraphQLString),
              },
            },
            resolve: (_, ctx) => this.domain.getFetcherState(ctx.fetcher),
          },

          accountState: {
            type: Types.AccountFetcherStateList,
            args: {
              account: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.getAccountFetcherState(ctx.account),
          },

          transactionState: {
            type: Types.TransactionStateList,
            args: {
              signature: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) => this.domain.getTransactionState(ctx.signature),
          },
        },
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          deleteTransactionCache: {
            type: GraphQLBoolean,
            args: {
              signature: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) => this.domain.delTransactionCache(ctx.signature),
          },
        },
      }),
    })
  }
}
