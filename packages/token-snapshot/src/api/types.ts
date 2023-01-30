import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql'
import { TokenType, GraphQLBigNumber } from '@aleph-indexer/core'

// ------------------- TOKENS --------------------------

export const TokenMint = new GraphQLObjectType({
  name: 'TokenMint',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    programId: { type: new GraphQLNonNull(GraphQLString) },
    tokenInfo: { type: TokenType },
  },
})

export const TokenMints = new GraphQLList(TokenMint)

// ------------------- HOLDERS --------------------------
export const LendingBalance = new GraphQLObjectType({
  name: 'LendingBalance',
  fields: {
    deposited: { type: new GraphQLNonNull(GraphQLBigNumber) },
    borrowed: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const TokenBalances = new GraphQLObjectType({
  name: 'TokenBalances',
  fields: {
    wallet: { type: new GraphQLNonNull(GraphQLBigNumber) },
    solend: { type: new GraphQLNonNull(LendingBalance) },
    port: { type: new GraphQLNonNull(LendingBalance) },
    larix: { type: new GraphQLNonNull(LendingBalance) },
    total: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

// ------------------- HOLDERS --------------------------

export const TokenHolder = new GraphQLObjectType({
  name: 'TokenHolder',
  fields: {
    account: { type: new GraphQLNonNull(GraphQLString) },
    owner: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    balances: { type: new GraphQLNonNull(TokenBalances) },
    timestamp: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const TokenHolders = new GraphQLList(TokenHolder)
