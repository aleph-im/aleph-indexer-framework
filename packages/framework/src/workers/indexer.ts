/**
 * Bootstrapping file for the indexer worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
import { MsIds } from '../services/common.js'
import { IndexerMs } from '../services/indexer/index.js'
import { IndexerDomainContext } from '../services/indexer/src/base/types.js'
import { getMoleculerBroker, TransportType } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'
import {
  createFetcherMsClient,
  createIndexerMsClient,
  createIndexerMsMain,
  createParserMsClient,
} from './common.js'

initThreadContext()

async function main() {
  const {
    name,
    projectId,
    transport,
    transportConfig,
    channels,
    domainPath,
    supportedBlockchains,
  } = workerData as Required<WorkerInfo>

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

  console.log('supportedBlockchains')
  const parserMsClient = await createParserMsClient(
    supportedBlockchains,
    broker,
    true,
    { group: name },
  )

  const fetcherMsClient = await createFetcherMsClient(
    supportedBlockchains,
    broker,
  )

  const indexerMsClient = await createIndexerMsClient(
    supportedBlockchains,
    localBroker,
  )

  const DomainClass = (await import(domainPath)).default
  const domain = new DomainClass({
    instanceName: name,
    apiClient: indexerMsClient,
    dataPath: basePath,
    projectId,
    supportedBlockchains,
    transport,
  } as IndexerDomainContext)

  const indexerMsMain = await createIndexerMsMain(
    supportedBlockchains,
    basePath,
    domain,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
  )

  IndexerMs.mainFactory = () => indexerMsMain

  localBroker.createService(IndexerMs)

  await broker.start()
  await broker.waitForServices([MsIds.Fetcher, MsIds.Parser])

  if (localBroker !== broker) {
    await localBroker.start()
  }

  if (domain.init) await domain.init()
}

main()
