import express from 'express'
import cors from 'cors'
import { graphqlHTTP } from 'express-graphql'
import { mergeSchemas } from '@graphql-tools/schema'
import { GraphQLSchema } from 'graphql'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import * as expressTypes from 'express-serve-static-core'
import { GraphQLEndpoint } from './endpoint.js'

/**
 * Description for a GraphQL server. Has its own unique port and can be created from multiple endpoints, which have their own unique paths and GraphQL schemas.
 */
export class GraphQLServer {
  protected app: expressTypes.Application = {} as any | undefined

  /**
   * Initializes the GraphQL server. Can either use multiple endpoints, or a single schema.
   * @param schemas The schemas to use. Can be empty, if endpoints are used.
   * @param endpoints The endpoints to use. Can be empty, if schemas are used.
   * @param rateLimitConfig The rate limit configuration.
   */
  constructor(
    schemas: GraphQLSchema[] = [],
    endpoints: GraphQLEndpoint[] = [],
    rateLimitConfig: rateLimit.Options = {
      windowMs: 1000 * 10, // 10sec
      max: 20, // limit each IP to 20 requests per windowMs
    },
  ) {
    this.app = express()

    this.app.use(cors())
    this.app.use(compression())

    if (rateLimitConfig) {
      // @note: Read correct IPs being behind a reverse-proxy 'x-forwarded-for' header (needed by rate-limit)
      // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB or API Gateway, Nginx, etc)
      // see https://expressjs.com/en/guide/behind-proxies.html
      this.app.set('trust proxy', 1)

      const limiter = rateLimit({
        ...rateLimitConfig,
        // store: new RateLimitLevelStore(
        //   'rate-limit',
        //   rateLimitConfig.windowMs || 1000 * 10,
        // ),
      })

      this.app.use(limiter)
    }

    if (endpoints.length === 0) {
      this.app.use(
        '/',
        graphqlHTTP({
          schema: mergeSchemas({ schemas }),
          graphiql: true,
        }),
      )
    }

    if (schemas.length === 0) {
      throw new Error('No schemas or endpoints provided.')
    }

    endpoints.forEach((endpoint) => {
      this.app.use(
        endpoint.endpoint(),
        graphqlHTTP({
          schema: endpoint.schema(),
          graphiql: endpoint.graphiql(),
        }),
      )
    })
  }

  /**
   * Starts the GraphQL server.
   * @param port The port to listen on.
   */
  start(port = 8080): void {
    this.app.listen(port, () => {
      console.log(`Running a GraphQL API server at localhost:${port}`)
    })
  }

  /**
   * Closes the GraphQL server, by removing all listeners.
   */
  stop(): void {
    // TODO: Is this sufficient?
    this.app.removeAllListeners()
  }
}
