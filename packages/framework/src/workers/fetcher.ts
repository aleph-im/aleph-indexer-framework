/**
 * Bootstrapping file for the fetcher worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
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
