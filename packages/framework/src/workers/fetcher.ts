/**
 * Bootstrapping file for the fetcher worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
import {
  solanaPrivateRPCRoundRobin,
  solanaMainPublicRPCRoundRobin,
} from '@aleph-indexer/core'
import {
  FetcherMs,
  FetcherMsClient,
  FetcherMsMain,
} from '../services/fetcher/index.js'
import { getMoleculerBroker, TransportType } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'
import { MsIds } from '../services/common.js'

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

  const blockchainFetcherMains = await Promise.all(
    supportedBlockchains.map(async (blockchainId) => {
      const module = await import(`./impl/fetcher/${blockchainId}.js`)
      const factory = module.default
      const fetcherBasePath = path.join(basePath, blockchainId)

      const fetcher = factory(broker, fetcherBasePath)
      return [blockchainId, fetcher]
    }),
  )

  const blockchainFetcherClients = await Promise.all(
    supportedBlockchains.map(async (blockchainId) => {
      const module = await import(
        `../services/fetcher/src/${blockchainId}/client.js`
      )
      const clazz = module.default
      return [blockchainId, new clazz(blockchainId, broker)]
    }),
  )

  const fetcherMsClient = new FetcherMsClient(
    broker,
    Object.fromEntries(blockchainFetcherClients),
  )

  const fetcherServiceMain = new FetcherMsMain(
    fetcherMsClient,
    Object.fromEntries(blockchainFetcherMains),
  )

  FetcherMs.mainFactory = () => fetcherServiceMain

  broker.createService(FetcherMs)
  await broker.start()
  await broker.waitForServices([MsIds.Parser])

  if (localBroker !== broker) {
    localBroker.createService(FetcherMs)
    await localBroker.start()
  }
}

main()
