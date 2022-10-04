import { GraphQLSchema } from 'graphql'
import { mergeSchemas } from '@graphql-tools/schema'

/**
 * Description for a GraphQL endpoint. Has its own unique path and can be created from multiple schemas, which are merged together.
 * Is used in the {@link GraphQLServer} class to create a new endpoint.
 */
export class GraphQLEndpoint {
  protected path: string
  protected schemas: GraphQLSchema[]
  public showGraphiQL: boolean

  /**
   * Initializes the GraphQL endpoint. Needs to be passed to the {@link GraphQLServer} class, before a GraphQL server can be started.
   * @param path The path to define the endpoint on.
   * @param schemas The schemas to deploy.
   * @param graphiql Whether to show the GraphiQL interface for this endpoint.
   */
  constructor(path = '/', schemas: GraphQLSchema[], graphiql = false) {
    this.path = path
    this.schemas = schemas
    this.showGraphiQL = graphiql
  }

  /**
   * Returns the path of the endpoint.
   */
  endpoint(): string {
    return this.path
  }

  /**
   * Returns the merged schema of all the schemas passed to the endpoint.
   */
  schema(): GraphQLSchema {
    const schemas = this.schemas
    return mergeSchemas({ schemas })
  }

  /**
   * Returns whether the GraphiQL interface is shown for this endpoint.
   */
  graphiql(): boolean {
    return this.showGraphiQL
  }
}
