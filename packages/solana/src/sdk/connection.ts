import {
  Connection as SolConnection,
  ConnectionConfig,
  FetchMiddleware,
} from '@solana/web3.js'
import http, { AgentOptions } from 'http'
import https from 'https'
import CacheableLookup from 'cacheable-lookup'
import { Utils } from '@aleph-indexer/core'

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
      const freeSockets = Object.keys(agent.freeSockets).length
      const sockets = Object.keys(agent.sockets).length
      const requests = Object.keys(agent.requests).length

      if (freeSockets > 100 || sockets > 100 || requests > 100) {
        console.log(`
          agent [${endpoint}]: {
            freeSockets: ${freeSockets},
            sockets: ${sockets},
            requests: ${requests},
          }
        `)
      }
    }, 1000 * 10)

    cacheable.install(agent)

    // Solana RPC client is limiting the socket pool to 25
    // (override this behavior by deleting their agent with the node default)
    const overrideAgent: FetchMiddleware = (url, options, fetch) => {
      ;(options as any).agent = agent
    }

    super(endpoint, {
      ...config,
      fetchMiddleware: async (url, options, fetch) => {
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

      const rateLimitClient = new Utils.RateLimitClient(
        new Utils.ComposeRateLimit([
          new Utils.SparseRateLimit(config),
          new Utils.AccurateRateLimit(config),
          new Utils.ConcurrenceRateLimit(config),
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
