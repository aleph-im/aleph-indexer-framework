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
            type: Types.FetcherEntityStateList,
            args: {
              blockchain: { type: new GraphQLList(Types.Blockchain) },
              type: { type: new GraphQLList(Types.EntityType) },
              fetcher: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx) =>
              this.domain.getFetcherState(
                ctx.blockchain,
                ctx.type,
                ctx.fetcher,
              ),
          },

          accountState: {
            type: Types.AccountEntityFetcherStateList,
            args: {
              blockchain: { type: new GraphQLNonNull(Types.Blockchain) },
              type: { type: new GraphQLNonNull(Types.EntityType) },
              account: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.getAccountEntityFetcherState(
                ctx.blockchain,
                ctx.type,
                ctx.account,
              ),
          },

          entityState: {
            type: Types.EntityStateList,
            args: {
              blockchain: { type: new GraphQLNonNull(Types.Blockchain) },
              type: { type: new GraphQLNonNull(Types.EntityType) },
              id: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.getEntityState(ctx.blockchain, ctx.type, ctx.id),
          },
        },
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          deleteEntityCache: {
            type: GraphQLBoolean,
            args: {
              blockchain: { type: new GraphQLNonNull(Types.Blockchain) },
              type: { type: new GraphQLNonNull(Types.EntityType) },
              id: {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
              },
            },
            resolve: (_, ctx) =>
              this.domain.delEntityCache(ctx.blockchain, ctx.type, ctx.id),
          },
        },
      }),
    })
  }
}
