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
            type: Types.TimeInfo,
            args: {},
            resolve: () => new Date().toISOString(),
          },

          fetcherState: {
            type: Types.FetcherStateList,
            args: {
              blockchain: { type: new GraphQLList(Types.Blockchain) },
              fetcher: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx) =>
              this.domain.getFetcherState(ctx.blockchain, ctx.fetcher),
          },

          accountState: {
            type: Types.AccountFetcherStateList,
            args: {
              blockchain: { type: new GraphQLNonNull(Types.Blockchain) },
              account: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.getAccountTransactionFetcherState(
                ctx.blockchain,
                ctx.account,
              ),
          },

          transactionState: {
            type: Types.TransactionStateList,
            args: {
              blockchain: { type: new GraphQLNonNull(Types.Blockchain) },
              signature: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.getTransactionState(ctx.blockchain, ctx.signature),
          },
        },
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          deleteTransactionCache: {
            type: GraphQLBoolean,
            args: {
              blockchain: { type: new GraphQLNonNull(Types.Blockchain) },
              signature: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.delTransactionCache(ctx.blockchain, ctx.signature),
          },
        },
      }),
    })
  }
}
