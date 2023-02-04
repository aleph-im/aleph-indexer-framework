import {
  BaseEntityFetcher,
  Blockchain,
  IndexableEntityType,
  PendingEntityStorage,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumClient } from '../../../../sdk/client.js'
import { EthereumRawLog } from '../../../../types.js'
import { EthereumRawLogStorage } from './dal/rawLog.js'

/**
 * The main class of the fetcher service.
 */
export class EthereumLogFetcher extends BaseEntityFetcher<EthereumRawLog> {
  constructor(
    protected ethereumClient: EthereumClient,
    protected broker: ServiceBroker,
    protected pendingLogDAL: PendingEntityStorage,
    protected pendingLogCacheDAL: PendingEntityStorage,
    protected pendingLogFetchDAL: PendingEntityStorage,
    protected rawLogDAL: EthereumRawLogStorage,
  ) {
    super(
      IndexableEntityType.Log,
      Blockchain.Ethereum,
      broker,
      pendingLogDAL,
      pendingLogCacheDAL,
      pendingLogFetchDAL,
      rawLogDAL,
    )
  }

  protected filterEntityId(id: string): boolean {
    // @todo: Filter valid ethereum signatures
    return id.toLocaleLowerCase() === id
  }

  protected async remoteFetchIds(
    ids: string[],
    isRetry: boolean,
  ): Promise<(EthereumRawLog | null | undefined)[]> {
    // @note: Look for them on the cache the first time.
    // In case they are not there do a fallback request to rpc
    if (!isRetry) {
      // @note: Right now we are caching all logs in level
      // @note: This is not necessary (just a  performance hack)
      return Promise.all(
        ids.map(async (id) => {
          try {
            const log = await this.rawLogDAL.get([id])
            return log || null
          } catch (e) {
            this.log('remoteFetchIds error', e)
            return null
          }
        }),
      )
    } else {
      this.log('fetching logs from RPC')
      return this.ethereumClient.getLogs(ids, {
        swallowErrors: true,
      })
    }
  }
}
