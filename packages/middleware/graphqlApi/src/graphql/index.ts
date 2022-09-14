import { GraphQLEndpoint } from '@aleph-indexer/core'

import { GraphQLDefaultSchema } from './schema.js'
import { GraphQLDefaultResolvers } from './resolvers.js'

const schema = new GraphQLDefaultSchema(new GraphQLDefaultResolvers())

export const graphQLDefaultEndpoint = new GraphQLEndpoint('/v2', [schema], true)
export default graphQLDefaultEndpoint
