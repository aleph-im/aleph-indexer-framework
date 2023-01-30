import { ServiceBroker } from 'moleculer'
import {
  BlockchainFetcherI,
  FetcherClientI,
  FetcherMsClient,
} from './services/fetcher/index.js'
import {
  BlockchainParserI,
  ParserClientI,
  ParserMsClient,
} from './services/parser/index.js'
import {
  BlockchainIndexerI,
  IndexerClientI,
  IndexerDomainContext,
  IndexerMsClient,
  IndexerWorkerDomainI,
} from './services/indexer/index.js'
import { BlockchainIndexerWorkerI } from './utils/domain/index.js'

// -------------- RAW EVENTS -------------------

/**
 * Defines the common properties for all events.
 */
export type EventBase<EventType> = {
  id: string
  timestamp: number
  type: EventType
  /**
   * Account where the transaction and therefore the event comes from.
   */
  account?: string
}

export type RawEntity = {
  id: string
}

export type ParsedEntity<P> = RawEntity & {
  parsed: P
}

// ---------------- Supported blockchains --------------------------

export enum Blockchain {
  Ethereum = 'ethereum',
  Solana = 'solana',
}

export enum IndexableEntityType {
  Transaction = 'transaction',
  Log = 'log',
  State = 'state',
}

export type BlockchainFetcherClientFactory = (
  blockchainId: Blockchain,
  broker: ServiceBroker,
) => Promise<FetcherClientI>

export type BlockchainParserClientFactory = (
  blockchainId: Blockchain,
  broker: ServiceBroker,
) => Promise<ParserClientI>

export type BlockchainIndexerClientFactory = (
  blockchainId: Blockchain,
  broker: ServiceBroker,
) => Promise<IndexerClientI>

export type BlockchainFetcherFactory = (
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
) => Promise<BlockchainFetcherI>

export type BlockchainParserFactory = (
  basePath: string,
  layoutPath?: string,
) => Promise<BlockchainParserI>

export type BlockchainIndexerFactory = (
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
) => Promise<BlockchainIndexerI>

export type BlockchainWorkerDomainFactory = (
  context: IndexerDomainContext,
  hooks: unknown,
) => Promise<BlockchainIndexerWorkerI<ParsedEntity<unknown>>>

// @todo
export type BlockchainMainDomainFactory = (
  context: IndexerDomainContext,
  hooks: unknown,
) => Promise<unknown>

export interface BlockchainFrameworkImplementation {
  fetcher: {
    main: BlockchainFetcherFactory
    client: BlockchainFetcherClientFactory
  }
  parser: {
    main: BlockchainParserFactory
    client: BlockchainParserClientFactory
  }
  indexer: {
    main: BlockchainIndexerFactory
    client: BlockchainIndexerClientFactory
    domain: {
      worker: BlockchainWorkerDomainFactory
      main: BlockchainMainDomainFactory | null
    }
  }
}
