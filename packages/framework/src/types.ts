/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceBroker } from 'moleculer'
import { config, Utils } from '@aleph-indexer/core'
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

export type BlockchainId = string

export enum BlockchainChain {
  Ethereum = 'ethereum',
  Bsc = 'bsc',
  Solana = 'solana',
  Oasys = 'oasys',
  OasysVerse = 'oasys-verse',
}

export type BlockchainConfig = {
  chain: BlockchainChain
  id: BlockchainId
}

export type Blockchain = BlockchainId | BlockchainConfig

export enum IndexableEntityType {
  Block = 'block',
  Transaction = 'transaction',
  Log = 'log',
  State = 'state',
}

export type BlockchainFetcherClientFactory = (
  blockchainId: BlockchainId,
  broker: ServiceBroker,
) => Promise<FetcherClientI>

export type BlockchainParserClientFactory = (
  blockchainId: BlockchainId,
  broker: ServiceBroker,
) => Promise<ParserClientI>

export type BlockchainIndexerClientFactory = (
  blockchainId: BlockchainId,
  broker: ServiceBroker,
) => Promise<IndexerClientI>

export type BlockchainFetcherFactory = (
  blockchainId: BlockchainId,
  basePath: string,
  broker: ServiceBroker,
  fetcherClient: FetcherMsClient,
) => Promise<BlockchainFetcherI>

export type BlockchainParserFactory = (
  blockchainId: BlockchainId,
  basePath: string,
  layoutPath?: string,
) => Promise<BlockchainParserI>

export type BlockchainIndexerFactory = (
  blockchainId: BlockchainId,
  basePath: string,
  domain: IndexerWorkerDomainI,
  indexerMsClient: IndexerMsClient,
  fetcherMsClient: FetcherMsClient,
  parserMsClient: ParserMsClient,
) => Promise<BlockchainIndexerI>

export type BlockchainWorkerDomainFactory = (
  blockchainId: BlockchainId,
  context: IndexerDomainContext,
  hooks: any,
) => Promise<BlockchainIndexerWorkerI<ParsedEntity<unknown>>>

// @todo
export type BlockchainMainDomainFactory = (
  blockchainId: BlockchainId,
  context: IndexerDomainContext,
  hooks: any,
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

export function getBlockchainConfig(blockchain: Blockchain): BlockchainConfig {
  if (typeof blockchain === 'string') {
    const parts = blockchain.split(':')

    const [chain, id] = (
      parts.length < 2 ? [blockchain, blockchain] : parts
    ) as [BlockchainChain, string]

    if (!Object.values(BlockchainChain).includes(chain as BlockchainChain))
      throw new Error(
        `Blockchain module not found, try installing it running "npm i @aleph-indexer/${chain}"\nSupported chains are:\n${Object.values(
          BlockchainChain,
        ).join('\n')}`,
      )

    const parsedId = Utils.toKebabCase(id)
    if (parsedId !== id)
      throw new Error(
        `Blockchain id should be specified in kebab-case format (${parsedId} instead of ${id})`,
      )

    return { chain, id }
  }

  return blockchain
}

export function getBlockchainEnv<M extends boolean>(
  blockchainId: BlockchainId,
  name: string,
  mandatory: M,
): M extends false ? string | undefined : string {
  const ENV = Utils.toSnakeCase(`${blockchainId}_${name}`).toUpperCase()

  const value = config[ENV]
  if (mandatory && !value) throw new Error(`mandatory env var "${ENV}" not set`)

  return value as M extends false ? string | undefined : string
}
