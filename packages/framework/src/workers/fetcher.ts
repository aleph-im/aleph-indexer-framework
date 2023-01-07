/**
 * Bootstrapping file for the fetcher worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
import {
  solanaPrivateRPCRoundRobin,
  solanaMainPublicRPCRoundRobin,
} from '@aleph-indexer/core'
import { FetcherMs } from '../services/fetcher/index.js'
import { getMoleculerBroker, TransportType } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'
import { MsIds } from '../services/common.js'
import { createFetcherMsClient, createFetcherMsMain } from './common.js'

initThreadContext()

async function main() {
  const { name, transport, transportConfig, channels, supportedBlockchains } =
    workerData as WorkerInfo

  const basePath = path.join(workerData.dataPath, name)

  // @note: Force resolve DNS and cache it before starting fetcher
  await Promise.allSettled(
    [
      ...solanaPrivateRPCRoundRobin.getAllClients(),
      ...solanaMainPublicRPCRoundRobin.getAllClients(),
    ].map(async (client) => {
      const conn = client.getConnection()
      const { result } = await (conn as any)._rpcRequest('getBlockHeight', [])
      console.log(`RPC ${conn.endpoint} last height: ${result}`)
    }),
  )

  const localBroker = getMoleculerBroker(name, TransportType.Thread, {
    channels,
  })

  const broker =
    transport !== TransportType.Thread
      ? getMoleculerBroker(name, transport, {
          channels,
          transportConfig,
        })
      : localBroker

  const fetcherMsClient = await createFetcherMsClient(
    supportedBlockchains,
    broker,
  )

  const fetcherMsMain = await createFetcherMsMain(
    supportedBlockchains,
    basePath,
    broker,
    fetcherMsClient,
  )

  FetcherMs.mainFactory = () => fetcherMsMain

  broker.createService(FetcherMs)
  await broker.start()
  await broker.waitForServices([MsIds.Parser])

  if (localBroker !== broker) {
    localBroker.createService(FetcherMs)
    await localBroker.start()
  }
}

main()
