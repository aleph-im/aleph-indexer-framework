import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql'
import { IndexerAPISchema } from '@aleph-indexer/framework'
import * as Types from './types.js'
import {
  EventsFilters,
  GlobalStatsFilters,
  APIResolvers,
  AccountsFilters,
} from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolvers = new APIResolvers(domain),
  ) {
    super(domain, {
      types: Types.types,

      customTimeSeriesTypesMap: {
        marinadeFinanceInfo: Types.AccessTimeStats,
      },
      customStatsType: Types.MarinadeFinanceStats,

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

          events: {
            type: Types.Events,
            args: {
              account: { type: new GraphQLNonNull(GraphQLString) },
              types: { type: new GraphQLList(Types.ParsedEvents) },
              startDate: { type: GraphQLFloat },
              endDate: { type: GraphQLFloat },
              limit: { type: GraphQLInt },
              skip: { type: GraphQLInt },
              reverse: { type: GraphQLBoolean },
            },
            resolve: (_, ctx) => this.resolver.getEvents(ctx as EventsFilters),
          },

          globalStats: {
            type: Types.GlobalMarinadeFinanceStats,
            args: {
              types: { type: GraphQLString },
              accounts: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx) =>
              resolver.getGlobalStats(ctx as GlobalStatsFilters),
          },
        },
      }),
    })
  }
}
