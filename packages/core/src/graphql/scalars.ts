import graphql, { Kind, ValueNode } from 'graphql'
import BN from 'bn.js'

/**
 * GraphQL Big Number scalar type
 */
export const GraphQLBigNumber = new graphql.GraphQLScalarType({
  name: 'BigNumber',
  description: 'GraphQL representation of BigNumber',
  parseValue(value) {
    return new BN(value as string, 10) // value from the client input variables
  },
  serialize(value) {
    // @note: Fallback in cases that we have an hex string instead of the BN instance (db de-serialization / internal api responses)
    value = typeof value === 'string' ? new BN(value, 'hex') : value
    return value ? (value as BN).toString(10) : null // value sent to the client
  },
})

/**
 * GraphQL Long validation
 */
export function coerceLong(value: any) {
  if (value === '')
    throw new TypeError(
      'Long cannot represent non 52-bit signed integer value: (empty string)',
    )
  const num: number = value
  if (
    num == num &&
    num <= Number.MAX_SAFE_INTEGER &&
    num >= Number.MIN_SAFE_INTEGER
  )
    return num < 0 ? Math.ceil(num) : Math.floor(num)
  throw new TypeError(
    'Long cannot represent non 52-bit signed integer value: ' + String(value),
  )
}

/**
 * GraphQL Long scalar type
 */
export const GraphQLLong = new graphql.GraphQLScalarType({
  name: 'Long',
  description: 'The `Long` scalar type represents 52-bit integers',
  parseValue: coerceLong,
  serialize: coerceLong,
  parseLiteral(ast: ValueNode) {
    if (ast.kind == Kind.INT) {
      const num = parseInt(ast.value, 10)
      if (num <= Number.MAX_SAFE_INTEGER && num >= Number.MIN_SAFE_INTEGER)
        return num
    }
    return null
  },
})
