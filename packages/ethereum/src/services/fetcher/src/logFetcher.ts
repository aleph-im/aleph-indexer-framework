import {
  BaseEntityFetcher,
  Blockchain,
  IndexableEntityType,
  PendingEntityStorage,
} from '@aleph-indexer/framework'
import { ServiceBroker } from 'moleculer'
import { EthereumClient } from '../../../sdk/client.js'
import { EthereumRawLog } from '../../../types.js'
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
    // @note: Right now we are caching all logs in level
    // @todo: Implement getLogsByIds method on ethereum client
    const logs = await Promise.all(
      ids.map(async (id) => {
        try {
          const log = await this.rawLogDAL.get([id])
          return log || null
        } catch (e) {
          console.log('ethereum remoteFetchIds error', e)
          return null
        }
      }),
    )

    // return this.ethereumClient.getLogsByIds(ids, {
    //   swallowErrors: true,
    // })

    return logs
  }
}
