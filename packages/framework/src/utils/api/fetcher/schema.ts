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
      types: Types.fetcherGrapQLTypes,
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          time: {
            type: Types.GraphQLTimeInfo,
            args: {},
            resolve: () => new Date().toISOString(),
          },

          fetcherState: {
            type: Types.GraphQLFetcherEntityStateList,
            args: {
              blockchain: { type: new GraphQLList(Types.GraphQLBlockchain) },
              type: { type: new GraphQLList(Types.GraphQLEntityType) },
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
            type: Types.GraphQLAccountEntityFetcherStateList,
            args: {
              blockchain: {
                type: new GraphQLNonNull(Types.GraphQLBlockchain),
              },
              type: { type: new GraphQLNonNull(Types.GraphQLEntityType) },
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
            type: Types.GraphQLEntityStateList,
            args: {
              blockchain: {
                type: new GraphQLNonNull(Types.GraphQLBlockchain),
              },
              type: { type: new GraphQLNonNull(Types.GraphQLEntityType) },
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
              blockchain: {
                type: new GraphQLNonNull(Types.GraphQLBlockchain),
              },
              type: { type: new GraphQLNonNull(Types.GraphQLEntityType) },
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
