import { GraphQLEnumType, GraphQLString } from 'graphql'
import { Blockchain as BC, IndexableEntityType as IET } from '../../types.js'

// Time
export const TimeInfo = GraphQLString

const bcValues = Object.fromEntries(
  Object.values(BC).map((value) => [value, { value }]),
)

export const Blockchain = new GraphQLEnumType({
  name: 'Blockchain',
  values: bcValues,
})

const ietValues = Object.fromEntries(
  Object.values(IET).map((value) => [value, { value }]),
)

export const EntityType = new GraphQLEnumType({
  name: 'EntityType',
  values: ietValues,
})
