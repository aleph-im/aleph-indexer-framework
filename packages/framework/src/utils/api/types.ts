import { GraphQLEnumType, GraphQLString } from 'graphql'
import { Blockchain as BC, IndexableEntityType as IET } from '../../types.js'

// Time
export const TimeInfo = GraphQLString

export const Blockchain = new GraphQLEnumType({
  name: 'Blockchain',
  values: {
    [BC.Solana]: { value: BC.Solana },
    [BC.Ethereum]: { value: BC.Ethereum },
  },
})

export const EntityType = new GraphQLEnumType({
  name: 'EntityType',
  values: {
    [IET.Transaction]: { value: IET.Transaction },
    [IET.Log]: { value: IET.Log },
    [IET.State]: { value: IET.State },
  },
})
