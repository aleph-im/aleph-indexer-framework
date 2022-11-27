import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { IndexerAPISchema } from '@aleph-indexer/framework'
import * as Types from './types.js'
import { APIResolver, CandlesFilters, PricesFilters } from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolver = new APIResolver(domain),
  ) {
    super(domain, {
      customTimeSeriesTypesMap: { candle: Types.Candle },
      customStatsType: Types.DataFeedStats,

      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          dataFeeds: {
            type: Types.DataFeedInfo,
            args: {},
            resolve: () => this.resolver.getDataFeeds(),
          },

          dataFeedStats: {
            type: Types.DataFeedStats,
            args: {
              dataFeeds: { type: new GraphQLList(GraphQLString) },
            },
            resolve: () => this.resolver.getDataFeedStats(),
          },

          prices: {
            type: Types.Price,
            args: {
              address: { type: new GraphQLNonNull(GraphQLString) },
              startDate: { type: GraphQLFloat },
              endDate: { type: GraphQLFloat },
              limit: { type: GraphQLInt },
              skip: { type: GraphQLInt },
              reverse: { type: GraphQLBoolean },
            },
            resolve: (_, ctx) => this.resolver.getPrices(ctx as PricesFilters),
          },

          candles: {
            type: Types.Candle,
            args: {
              address: { type: new GraphQLNonNull(GraphQLString) },
              candleInterval: {
                type: new GraphQLNonNull(Types.CandleInterval),
              },
              startDate: { type: GraphQLFloat },
              endDate: { type: GraphQLFloat },
              limit: { type: GraphQLInt },
              skip: { type: GraphQLInt },
              reverse: { type: GraphQLBoolean },
            },
            resolve: (_, ctx) =>
              this.resolver.getCandles(ctx as CandlesFilters),
          },

          globalStats: {
            type: Types.GlobalStats,
            args: {},
            resolve: () => this.resolver.getGlobalStats(),
          },
        },
      }),
    })
  }
}
