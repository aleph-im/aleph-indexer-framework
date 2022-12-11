/**
 * Bootstrapping file for the indexer worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
import { MsIds } from '../services/common.js'
import { FetcherMsClient } from '../services/fetcher/index.js'
import { IndexerMs, IndexerMsMain } from '../services/indexer/index.js'
import { createTransactionIndexerStateDAL } from '../services/indexer/src/dal/transactionIndexerState.js'
import { createTransactionRequestDAL } from '../services/indexer/src/dal/transactionRequest.js'
import { createTransactionRequestIncomingTransactionDAL } from '../services/indexer/src/dal/transactionRequestIncomingTransaction.js'
import { createTransactionRequestPendingSignatureDAL } from '../services/indexer/src/dal/transactionRequestPendingSignature.js'
import { createTransactionRequestResponseDAL } from '../services/indexer/src/dal/transactionRequestResponse.js'
import { IndexerDomainContext } from '../services/indexer/src/types.js'
import { ParserMsClient } from '../services/parser/client.js'
import { getMoleculerBroker, TransportType } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'

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

  const dataPath = path.join(workerData.dataPath, name)

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

  const fetcherMsClient = new FetcherMsClient(broker)
  const parserMsClient = new ParserMsClient(broker, true, {
    group: name,
  })

  const indexerMain = new IndexerMsMain(
    localBroker,
    fetcherMsClient,
    parserMsClient,
    createTransactionRequestDAL(dataPath),
    createTransactionRequestIncomingTransactionDAL(dataPath),
    createTransactionRequestPendingSignatureDAL(dataPath),
    createTransactionRequestResponseDAL(dataPath),
    createTransactionIndexerStateDAL(dataPath),
  )

  const DomainClass = (await import(domainPath)).default
  const domain = new DomainClass({
    instanceName: name,
    apiClient: indexerMain,
    dataPath,
    projectId,
    supportedBlockchains,
    transport,
  } as IndexerDomainContext)
  ;(indexerMain as any).domain = domain

  IndexerMs.mainFactory = () => indexerMain
  localBroker.createService(IndexerMs)

  await broker.start()
  await broker.waitForServices([MsIds.Fetcher, MsIds.Parser])

  if (localBroker !== broker) {
    await localBroker.start()
  }

  if (domain.init) await domain.init()
}

main()
