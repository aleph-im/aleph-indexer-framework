import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLSchemaConfig,
  GraphQLString,
} from 'graphql'
import { IndexerMainDomain } from '../../domain/index.js'
import * as Types from './types.js'
import {GraphQLDateTime, GraphQLDuration} from "graphql-scalars"

export type APISchemaConfig = GraphQLSchemaConfig & {
  customTimeSeriesTypesMap?: Record<string, GraphQLObjectType>
  customStatsType?: GraphQLObjectType
}

/**
 * Combines the indexer's domain class with the fetcher's API.
 */
export abstract class IndexerAPISchema extends GraphQLSchema {
  constructor(protected domain: IndexerMainDomain, config: APISchemaConfig) {
    config.types = [...(config.types || []), ...Types.types]

    config.query =
      config.query ||
      new GraphQLObjectType({
        name: 'Query',
        fields: {},
      })

    const queryConf = config.query.toConfig()

    queryConf.fields = {
      ...queryConf.fields,

      time: {
        type: GraphQLDateTime,
        args: {},
        resolve: () => new Date().toISOString(),
      },

      accountState: {
        type: Types.AccountStateList,
        args: {
          account: { type: new GraphQLList(GraphQLString) },
        },
        resolve: (_, ctx) => this.domain.getAccountState(ctx.account),
      },

      transactionRequest: {
        type: Types.TransactionRequestList,
        args: {
          indexer: { type: new GraphQLList(GraphQLString) },
          type: { type: Types.TransactionRequestType },
          nonce: { type: GraphQLFloat },
          complete: { type: GraphQLBoolean },
          account: { type: GraphQLString },
          signature: { type: GraphQLString },
        },
        resolve: (_, ctx) => this.domain.getTransactionRequests(ctx as any),
      },
    }

    if (domain.withStats()) {
      const { types, AccountTimeSeriesStatsList, AccountStatsList } =
        Types.getAccountTimeSeriesStatsType(
          config.customTimeSeriesTypesMap,
          config.customStatsType,
        )

      config.types = [...(config.types || []), ...types]

      queryConf.fields.accountTimeSeriesStats = {
        type: AccountTimeSeriesStatsList,
        args: {
          account: { type: new GraphQLList(GraphQLString) },
          type: { type: new GraphQLNonNull(GraphQLString) },
          timeFrame: { type: new GraphQLNonNull(GraphQLDuration) },
          startDate: { type: GraphQLFloat },
          endDate: { type: GraphQLFloat },
          limit: { type: GraphQLInt },
          reverse: { type: GraphQLBoolean },
        },
        resolve: (_, ctx) =>
          domain.getAccountTimeSeriesStats(ctx.account, ctx.type, {
            timeFrame: ctx.timeFrame,
            startDate: ctx.startDate,
            endDate: ctx.endDate,
            limit: ctx.limit,
            reverse: ctx.reverse,
          }),
      }

      queryConf.fields.accountStats = {
        type: AccountStatsList,
        args: {
          account: { type: new GraphQLList(GraphQLString) },
        },
        resolve: (_, ctx) => domain.getAccountStats(ctx.account),
      }
    }

    config.query = new GraphQLObjectType(queryConf)

    super(config)
  }
}
