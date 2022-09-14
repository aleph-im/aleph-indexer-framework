import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql'

import * as Types from './types.js'
import { SolanaGraphQLResolversBase } from './resolvers.js'

export class SolanaGraphQLSchema {
  public schema: GraphQLSchema

  constructor(protected resolver: SolanaGraphQLResolversBase) {
    const queryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        tokens: {
          type: new GraphQLList(Types.TokenType),
          resolve: () => this.resolver.getTokenList(),
        },

        address: {
          type: Types.AddressDetail,
          args: {
            address: { type: GraphQLString },
          },
          resolve: (_, { address }) => this.resolver.getAccountDetails(address),
        },

        history: {
          type: new GraphQLList(Types.TransactionItem),
          args: {
            address: { type: GraphQLString },
            poolAddress: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            skip: { type: GraphQLInt },
            reverse: { type: GraphQLBoolean },
          },
          resolve: (
            _,
            { address, poolAddress, limit = 100, skip = 0, reverse = true },
          ) =>
            this.resolver.getTransactions({
              address,
              poolAddress,
              limit,
              skip,
              reverse,
            }),
        },

        transaction: {
          type: Types.TransactionItem,
          args: {
            signature: { type: GraphQLString },
          },
          resolve: (_, { signature }) =>
            this.resolver.getTransaction(signature),
        },
      },
    })

    this.schema = new GraphQLSchema({ query: queryType })
  }
}
