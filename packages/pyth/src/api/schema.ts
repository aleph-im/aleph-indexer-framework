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
import {
  APIResolver,
  CandlesFilters,
  PricesFilters,
  AccountsFilters,
  PriceFilters,
} from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolver = new APIResolver(domain),
  ) {
    super(domain, {
      customTimeSeriesTypesMap: { candle: Types.Candle },
      customStatsType: Types.PythAccountStats,

      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          accounts: {
            type: Types.AccountsInfo,
            args: {
              types: { type: new GraphQLList(GraphQLString) },
              accounts: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx, __, info) => {
              ctx.includeStats =
                !!info.fieldNodes[0].selectionSet?.selections.find(
                  (item) =>
                    item.kind === 'Field' && item.name.value === 'stats',
                )

              return this.resolver.getAccounts(ctx as AccountsFilters)
            },
          },

          prices: {
            type: Types.Prices,
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

          price: {
            type: Types.Price,
            args: {
              address: { type: new GraphQLNonNull(GraphQLString) },
              timestamp: { type: new GraphQLNonNull(GraphQLFloat) },
            },
            resolve: (_, ctx) => this.resolver.getPriceByTimestamp(ctx as PriceFilters),
          },

          candles: {
            type: Types.Candles,
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
