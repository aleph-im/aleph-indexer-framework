import { GraphQLEnumType, GraphQLString } from 'graphql'
import { Blockchain as BC } from '../../types/index.js'

// Time
export const TimeInfo = GraphQLString

export const Blockchain = new GraphQLEnumType({
  name: 'Blockchain',
  values: {
    [BC.Solana]: { value: BC.Solana },
    [BC.Ethereum]: { value: BC.Ethereum },
  },
})
