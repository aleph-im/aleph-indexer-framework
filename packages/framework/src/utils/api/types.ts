import { GraphQLEnumType, GraphQLString } from 'graphql'
import { Blockchain as BC, IndexableEntityType as IET } from '../../types.js'

// Time
export const GraphQLTimeInfo = GraphQLString

const bcValues = Object.fromEntries(
  Object.values(BC).map((value) => [value, { value }]),
)

export const GraphQLBlockchain = new GraphQLEnumType({
  name: 'Blockchain',
  values: bcValues,
})

const ietValues = Object.fromEntries(
  Object.values(IET).map((value) => [value, { value }]),
)

export const GraphQLEntityType = new GraphQLEnumType({
  name: 'EntityType',
  values: ietValues,
})
