import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql'
import { GraphQLLong } from '@aleph-indexer/core'
import { IndexerAPISchema } from '@aleph-indexer/framework'
import * as Types from './types.js'
import { APIResolver, TokenEventsFilters } from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolver = new APIResolver(domain),
  ) {
    super(domain, {
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          tokenMints: {
            type: Types.TokenMints,
            args: {
              mint: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx) => this.resolver.getTokens(ctx.mint),
          },
          tokenHolders: {
            type: Types.TokenHolders,
            args: {
              mint: { type: new GraphQLNonNull(GraphQLString) },
              timestamp: { type: GraphQLLong },
              limit: { type: GraphQLInt },
              skip: { type: GraphQLInt },
              reverse: { type: GraphQLBoolean },
              gte: { type: GraphQLString },
              lte: { type: GraphQLString },
            },
            resolve: (_, ctx) =>
              this.resolver.getTokenHoldings(ctx as TokenEventsFilters),
          },
        },
      }),
    })
  }
}
