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
  UsersFilters,
} from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolvers = new APIResolvers(domain),
  ) {
    super(domain, {
      types: Types.types,

      customTimeSeriesTypesMap: { access: Types.AccessTimeStats },
      customStatsType: Types.BrickStats,

      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          accounts: {
            type: Types.AccountsInfo,
            args: {
              types: { type: new GraphQLList(GraphQLString) },
              accounts: { type: new GraphQLList(GraphQLString) },
              app: { type: GraphQLString },
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

          userWithdrawalsAvailable: {
            type: Types.AccountsInfo,
            args: {
              address: { type: GraphQLString },
              app: { type: GraphQLString },
            },
            resolve: (_, ctx) => {
              return this.resolver.getUserWithdrawalsAvailable(ctx as UsersFilters)
            },
          },

          userRefundsAvailable: {
            type: Types.AccountsInfo,
            args: {
              address: { type: GraphQLString },
              app: { type: GraphQLString },
            },
            resolve: (_, ctx) => {
              return this.resolver.getUserRefundsAvailable(ctx as UsersFilters)
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
            type: Types.GlobalBrickStats,
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
