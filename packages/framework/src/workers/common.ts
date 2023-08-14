import path from 'path'
import { ServiceBroker } from 'moleculer'
import { FetcherMsClient, FetcherMsMain } from '../services/fetcher/index.js'
import { IndexerMsClient, IndexerMsMain } from '../services/indexer/index.js'
import { WorkerKind } from '../utils/workers.js'
import { IndexerWorkerDomainI } from '../main.js'
import { ParserMsClient } from '../services/parser/client.js'
import { ParserMsMain } from '../services/parser/main.js'
import { EventOptions } from '../services/common.js'
import { Blockchain, BlockchainId, getBlockchainConfig } from '../types.js'

// Clients -------------------------------------------

async function importBlockchainMsClients(
  kind: WorkerKind,
  supportedBlockchains: Blockchain[],
  broker: ServiceBroker,
): Promise<Record<BlockchainId, any>> {
  const blockchainClients = await Promise.all(
    supportedBlockchains.map(async (blockchain) => {
      const { id, chain } = getBlockchainConfig(blockchain)

      const module = await import(`@aleph-indexer/${chain}`)
      const factory = module.default?.[kind]?.client

      if (!factory)
        throw new Error(`Module not found, try: npm i @aleph-indexer/${chain}`)

      const instance = await factory(id, broker)
      return [id, instance]
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

export async function createParserMsClient(
  supportedBlockchains: Blockchain[],
  broker: ServiceBroker,
  clientEvents: boolean,
  eventOpts?: EventOptions,
): Promise<ParserMsClient> {
  const blockchainClients = await importBlockchainMsClients(
    WorkerKind.Parser,
    supportedBlockchains,
    broker,
  )

  return new ParserMsClient(broker, blockchainClients, clientEvents, eventOpts)
}

// Mains -------------------------------------------

async function importBlockchainMsMains(
  kind: WorkerKind,
  supportedBlockchains: Blockchain[],
  basePath: string,
  ...args: any[]
): Promise<Record<BlockchainId, any>> {
  const blockchainMains = await Promise.all(
    supportedBlockchains.map(async (blockchain) => {
      const { id, chain } = getBlockchainConfig(blockchain)

      const blockchainBasePath = path.join(basePath, id)

      const module = await import(`@aleph-indexer/${chain}`)
      const factory = module.default?.[kind]?.main

      if (!factory)
        throw new Error(`Module not found, try: npm i @aleph-indexer/${chain}`)

      const instance = await factory(id, blockchainBasePath, ...args)
      return [id, instance]
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

  return new IndexerMsMain(indexerMsClient, blockchainMains, domain)
}

export async function createParserMsMain(
  supportedBlockchains: Blockchain[],
  basePath: string,
  broker: ServiceBroker,
  layoutPath?: string,
): Promise<ParserMsMain> {
  const blockchainMains = await importBlockchainMsMains(
    WorkerKind.Parser,
    supportedBlockchains,
    basePath,
    layoutPath,
  )

  return new ParserMsMain(broker, blockchainMains)
}
