import { GraphQLEnumType, GraphQLString } from 'graphql'
import { Blockchain as BC, IndexableEntityType as IET } from '../../types.js'

// Time
export const GraphQLTimeInfo = GraphQLString

export const GraphQLBlockchain = new GraphQLEnumType({
  name: 'Blockchain',
  values: Object.fromEntries(
    Object.values(BC).map((value) => [value, { value }]),
  ),
})

export const GraphQLEntityType = new GraphQLEnumType({
  name: 'EntityType',
  values: Object.fromEntries(
    Object.values(IET).map((value) => [value, { value }]),
  ),
})
