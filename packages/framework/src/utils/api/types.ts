import { GraphQLEnumType, GraphQLString } from 'graphql'
import { IndexableEntityType as IET } from '../../types.js'

// Time
export const GraphQLTimeInfo = GraphQLString

export const GraphQLBlockchain = GraphQLString

export const GraphQLEntityType = new GraphQLEnumType({
  name: 'EntityType',
  values: Object.fromEntries(
    Object.values(IET).map((value) => [value, { value }]),
  ),
})
