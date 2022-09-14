import { GraphQLSchema } from 'graphql'
import { mergeSchemas } from '@graphql-tools/schema'

export class GraphQLEndpoint {
  protected path: string
  protected schemas: GraphQLSchema[]
  public showGraphiQL: boolean

  constructor(path = '/', schemas: GraphQLSchema[], graphiql = false) {
    this.path = path
    this.schemas = schemas
    this.showGraphiQL = graphiql
  }

  endpoint(): string {
    return this.path
  }

  schema(): GraphQLSchema {
    const schemas = this.schemas
    return mergeSchemas({ schemas })
  }

  graphiql(): boolean {
    return this.showGraphiQL
  }
}
