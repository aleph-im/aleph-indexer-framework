import {
  Connection as SolConnection,
  ConnectionConfig,
  FetchMiddleware,
} from '@solana/web3.js'
import http, { AgentOptions } from 'http'
import https from 'https'
import CacheableLookup from 'cacheable-lookup'
import {
  AccurateRateLimit,
  ConcurrenceRateLimit,
  ComposeRateLimit,
  RateLimitClient,
  SparseRateLimit,
} from '../../utils/ratelimit/index.js'
import { Base64 } from 'js-base64'
import fetch from 'cross-fetch'

export class Connection extends SolConnection {
  public endpoint: string
  public tokenInfo:
    | {
        token: string
        expiry: number
      }
    | undefined

  constructor(
    endpoint: string,
    config?: ConnectionConfig & { rateLimit?: boolean },
  ) {
    // @note: Performance improvements caching DNS resolutions
    // Read this: https://httptoolkit.tech/blog/configuring-nodejs-dns/
    const cacheable = new CacheableLookup()

    const options: AgentOptions = {
      keepAlive: true,
      maxSockets: Infinity,
    }

    const agent =
      endpoint.indexOf('https://') !== -1
        ? new https.Agent(options)
        : new http.Agent(options)

    setInterval(() => {
      console.log(`
      agent [${endpoint}]: {
        freeSockets: ${Object.keys(agent.freeSockets).length},
        sockets: ${Object.keys(agent.sockets).length},
        requests: ${Object.keys(agent.requests).length},
      }
    `)
    }, 1000 * 2)

    cacheable.install(agent)

    // Solana RPC client is limiting the socket pool to 25
    // (override this behavior by deleting their agent with the node default)
    const overrideAgent: FetchMiddleware = (url, options, fetch) => {
      options.agent = agent
    }

    // GenesysGo needs an authentication token
    // const overrideAuth: FetchMiddleware = async (url, options, fetch) => {
    //   if (!this.tokenInfo || this.tokenInfo.expiry <= Date.now()) {
    //     const token = await this._getGenesysgoAuthToken()
    //     this.tokenInfo = { token, expiry: Date.now() + 1000 * 60 * 5 }
    //   }

    //   options.headers = {
    //     ...(options || {}).headers,
    //     Authorization: 'Bearer ' + this.tokenInfo.token,
    //   }
    // }

    // const isAuth = endpoint.indexOf('genesysgo') !== -1

    super(endpoint, {
      ...config,
      fetchMiddleware: async (url, options, fetch) => {
        // if (isAuth) await overrideAuth(url, options, fetch)
        overrideAgent(url, options, fetch)
        return fetch(url, options)
      },
    })

    this.endpoint = endpoint

    if (config?.rateLimit) {
      // https://docs.solana.com/es/cluster/rpc-endpoints#rate-limits-2
      // @todo: Improve rate limits (concurrence, state, same endpoint bucket, etc...)
      // @note: they have diminished specific RPC method from 40req/10sec to to 10req/10sec
      const config = {
        limit: 10,
        interval: 1000 * (10 + 1), // @note: Adding 1 extra second
        maxConcurrence: 40,
      }

      const rateLimitClient = new RateLimitClient(
        new ComposeRateLimit([
          new SparseRateLimit(config),
          new AccurateRateLimit(config),
          new ConcurrenceRateLimit(config),
        ]),
      )

      let i = 0

      // @note: Hook super methods

      const superRpcRequest = this._rpcRequest
      const supeRpcBatchRequest = this._rpcBatchRequest

      this._rpcRequest = async (method: string, args: any[]): Promise<any> => {
        const release = await rateLimitClient.acquire()

        try {
          i++
          console.log('REQ s', this.endpoint, i)
          return await superRpcRequest(method, args)
        } finally {
          release()
        }
      }

      this._rpcBatchRequest = async (requests: any[]): Promise<any> => {
        const release = await rateLimitClient.acquire()

        try {
          i++
          console.log('REQ b', this.endpoint, i)
          return await supeRpcBatchRequest(requests)
        } finally {
          release()
        }
      }
    }
  }

  protected async _getGenesysgoAuthToken(): Promise<string> {
    const {
      GENESYSGO_AUTH_CLIENT,
      GENESYSGO_AUTH_SECRET,
      GENESYSGO_AUTH_ISSUER,
    } = process.env

    const token = Base64.encode(
      `${GENESYSGO_AUTH_CLIENT}:${GENESYSGO_AUTH_SECRET}`,
    )

    const url = `${GENESYSGO_AUTH_ISSUER}/token`

    // eslint-disable-next-line camelcase
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${token}`,
      },
      body: 'grant_type=client_credentials',
    })

    return (await response.json()).access_token
  }

  async _rpcRequestAndRetry(
    method: string,
    args: unknown[],
    retries = 10,
  ): Promise<unknown> {
    try {
      return await this._rpcRequest(method, args)
    } catch (e: any) {
      if (!e.type || e.type !== 'system' || retries <= 0) throw e

      console.log('Catch system error,', e.code, 'cooling down for 30sec...')
      console.log('Remaining attempts ', retries)

      setTimeout(async () => {
        retries--
        return await this._rpcRequestAndRetry(method, args, retries)
      }, 30000)
    }
  }
}
