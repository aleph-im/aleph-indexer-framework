import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql'

import * as Types from './types.js'
import { GraphQLApiResolvers, GraphQLOrderBookResolvers } from './resolvers.js'

export interface GraphQLApiSchema {
  getResolver(): GraphQLApiResolvers
}

export class GraphQLDefaultSchema
  extends GraphQLSchema
  implements GraphQLApiSchema
{
  resolvers: GraphQLApiResolvers
  constructor(protected resolver: GraphQLApiResolvers) {
    super({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          events: {
            type: new GraphQLList(Types.Events),
            resolve: (_, args) => this.resolver.getEvents(),
          },
        },
      }),
    })
    this.resolvers = this.resolver
  }
  getResolver(): GraphQLApiResolvers {
    return this.resolvers
  }
}

export interface GraphQLOrderBookSchema {
  getResolver(): GraphQLOrderBookResolvers
}

export class GraphQLOrderBookDefaultSchema
  extends GraphQLSchema
  implements GraphQLOrderBookSchema
{
  resolvers: GraphQLOrderBookResolvers
  constructor(protected resolver: GraphQLOrderBookResolvers) {
    super({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          summary: {
            type: new GraphQLList(Types.Summary),
            resolve: (_, args) => this.resolver.getSummary(),
          },
          ticker: {
            type: new GraphQLList(Types.Tickers),
            resolve: (_, args) => this.resolver.getTicker(),
          },
          orderbook: {
            type: new GraphQLList(Types.OrderBooks),
            resolve: (_, { marketPairs, depth, level }) =>
              this.resolver.getOrderBook(marketPairs, depth, level),
          },
          trades: {
            type: new GraphQLList(Types.Trades),
            resolve: (_, { marketPairs }) =>
              this.resolver.getTrades(marketPairs),
          },
        },
      }),
    })
    this.resolvers = this.resolver
  }
  getResolver(): GraphQLOrderBookResolvers {
    return this.resolvers
  }
}
