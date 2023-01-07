import path from 'path'
import { ServiceBroker } from 'moleculer'
import { Blockchain } from '@aleph-indexer/core'
import { FetcherMsClient, FetcherMsMain } from '../services/fetcher/index.js'
import { IndexerMsClient, IndexerMsMain } from '../services/indexer/index.js'
import { WorkerKind } from '../utils/workers.js'
import { IndexerWorkerDomainI } from '../main.js'
import { ParserMsClient } from '../services/parser/client.js'

// Clients -------------------------------------------

async function importBlockchainMsClients(
  kind: WorkerKind,
  supportedBlockchains: Blockchain[],
  broker: ServiceBroker,
): Promise<Record<Blockchain, any>> {
  const blockchainClients = await Promise.all(
    supportedBlockchains.map(async (blockchainId) => {
      const module = await import(
        `../services/${kind}/src/${blockchainId}/client.js`
      )
      const clazz = module.default
      const instance = new clazz(blockchainId, broker)
      return [blockchainId, instance]
    }),
  )

  return Object.fromEntries(blockchainClients)
}

export async function createFetcherMsClient(
  supportedBlockchains: Blockchain[],
  broker: ServiceBroker,
): Promise<FetcherMsClient> {
  const blockchainClients = await importBlockchainMsClients(
    WorkerKind.Fetcher,
    supportedBlockchains,
    broker,
  )

  return new FetcherMsClient(broker, blockchainClients)
}

export async function createIndexerMsClient(
  supportedBlockchains: Blockchain[],
  broker: ServiceBroker,
): Promise<IndexerMsClient> {
  const blockchainClients = await importBlockchainMsClients(
    WorkerKind.Indexer,
    supportedBlockchains,
    broker,
  )

  return new IndexerMsClient(broker, blockchainClients)
}

// Mains -------------------------------------------

async function importBlockchainMsMains(
  kind: WorkerKind,
  supportedBlockchains: Blockchain[],
  basePath: string,
  ...args: any[]
): Promise<Record<Blockchain, any>> {
  const blockchainMains = await Promise.all(
    supportedBlockchains.map(async (blockchainId) => {
      const module = await import(`./impl/${kind}/${blockchainId}.js`)
      const factory = module.default
      const blockchainBasePath = path.join(basePath, blockchainId)
      const instance = factory(blockchainBasePath, ...args)
      return [blockchainId, instance]
    }),
  )

  return Object.fromEntries(blockchainMains)
}

export async function createFetcherMsMain(
  supportedBlockchains: Blockchain[],
  basePath: string,
  broker: ServiceBroker,
  fetcherMsClient: FetcherMsClient,
): Promise<FetcherMsMain> {
  const blockchainMains = await importBlockchainMsMains(
    WorkerKind.Fetcher,
    supportedBlockchains,
    basePath,
    broker,
    fetcherMsClient,
  )

  return new FetcherMsMain(fetcherMsClient, blockchainMains)
}

export async function createIndexerMsMain(
  supportedBlockchains: Blockchain[],
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
): Promise<IndexerMsMain> {
  const blockchainMains = await importBlockchainMsMains(
    WorkerKind.Indexer,
    supportedBlockchains,
    basePath,
    domain,
    indexerMsClient,
    fetcherMsClient,
    parserMsClient,
  )

  return new IndexerMsMain(indexerMsClient, blockchainMains)
}
