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

export type APISchemaConfig = GraphQLSchemaConfig & {
  customTimeSeriesTypesMap?: Record<string, GraphQLObjectType>
  customStatsType?: GraphQLObjectType
}

/**
 * Combines the indexer's domain class with the fetcher's API.
 */
export abstract class IndexerAPISchema extends GraphQLSchema {
  constructor(protected domain: IndexerMainDomain, config: APISchemaConfig) {
    config.types = [...(config.types || []), ...Types.indexerGraphQLTypes]

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
        type: Types.GraphQLTimeInfo,
        args: {},
        resolve: () => new Date().toISOString(),
      },

      accountState: {
        type: Types.GraphQLAccountEntityIndexerStateList,
        args: {
          blockchain: { type: new GraphQLNonNull(Types.GraphQLBlockchain) },
          type: { type: new GraphQLNonNull(Types.GraphQLEntityType) },
          account: { type: new GraphQLList(GraphQLString) },
        },
        resolve: (_, ctx) =>
          this.domain.getAccountState(ctx.blockchain, ctx.type, ctx.account),
      },

      entityPendingRequest: {
        type: Types.GraphQLEntityPendingRequestList,
        args: {
          blockchain: { type: new GraphQLNonNull(Types.GraphQLBlockchain) },
          type: { type: new GraphQLNonNull(Types.GraphQLEntityType) },
          indexer: { type: new GraphQLList(GraphQLString) },
          requestType: { type: Types.GraphQLEntityRequestType },
          nonce: { type: GraphQLFloat },
          complete: { type: GraphQLBoolean },
          account: { type: GraphQLString },
          id: { type: GraphQLString },
        },
        resolve: (_, ctx) => {
          ctx.blockchainId = ctx.blockchain
          delete ctx.blockchain
          return this.domain.getEntityPendingRequests(ctx as any)
        },
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
          blockchain: { type: new GraphQLNonNull(Types.GraphQLBlockchain) },
          account: { type: new GraphQLList(GraphQLString) },
          type: { type: new GraphQLNonNull(GraphQLString) },
          timeFrame: { type: new GraphQLNonNull(Types.GraphQLTimeFrame) },
          startDate: { type: GraphQLFloat },
          endDate: { type: GraphQLFloat },
          limit: { type: GraphQLInt },
          reverse: { type: GraphQLBoolean },
        },
        resolve: (_, ctx) =>
          domain.getAccountTimeSeriesStats(
            ctx.blockchain,
            ctx.account,
            ctx.type,
            {
              timeFrame: ctx.timeFrame,
              startDate: ctx.startDate,
              endDate: ctx.endDate,
              limit: ctx.limit,
              reverse: ctx.reverse,
            },
          ),
      }

      queryConf.fields.accountStats = {
        type: AccountStatsList,
        args: {
          blockchain: { type: new GraphQLNonNull(Types.GraphQLBlockchain) },
          account: { type: new GraphQLList(GraphQLString) },
        },
        resolve: (_, ctx) =>
          domain.getAccountStats(ctx.blockchain, ctx.account),
      }
    }

    config.query = new GraphQLObjectType(queryConf)

    super(config)
  }
}
