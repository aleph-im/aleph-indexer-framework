import path from 'path'
import { GraphQLEndpoint, GraphQLServer } from '@aleph-indexer/core'
import {
  AllWorkerChannels,
  createWorkers,
  WorkerInfo,
  WorkerKind,
} from './src/utils/workers.js'
import { initThreadContext } from './src/utils/threads.js'
import {
  getMoleculerBroker,
  TransportType,
} from './src/utils/moleculer/config.js'
import { IndexerMsClient } from './src/services/indexer/client.js'
import { IndexerMainDomainContext } from './src/services/indexer/src/types.js'
import { FetcherMsClient } from './src/services/fetcher/client.js'
import { FetcherMainDomain } from './src/utils/index.js'
import { FetcherMainDomainContext } from './src/services/fetcher/src/types.js'
import { FetcherAPISchema } from './src/utils/api/fetcher/schema.js'

export * from './src/services/fetcher/src/types.js'
export * from './src/services/parser/src/types.js'
export * from './src/services/indexer/src/types.js'

export * from './src/services/fetcher/interface.js'
export * from './src/services/parser/interface.js'
export * from './src/services/indexer/interface.js'

export * from './src/services/indexer/client.js'
export * from './src/utils/index.js'

/**
 * Configs to initialize the framework.
 */
export type IndexerConfig = {
  /**
   * ID which will be used to prefix the services' IDs.
   */
  projectId: string
  /**
   * The transport layer type to use.
   */
  transport?: TransportType
  /**
   * The transport layer configuration.
   */
  transportConfig?: {
    /**
     * @todo
     */
    tcpUrls?: string | string[]
    /**
     * @todo
     */
    natsUrl?: string
  }
  /**
   * The port which the API will be exposed on.
   */
  apiPort?: number
  /**
   * Indexer service configuration.
   */
  indexer?: {
    /**
     * The path to the directory which will be used to store the indexer's data.
     */
    dataPath?: string
    /**
     * Singleton instance of the main API service.
     */
    main: {
      /**
       * Path to the domain class, which interfaces with the main API service.
       */
      domainPath: string
      /**
       * Path to the main API service class.
       */
      apiSchemaPath: string
    }
    /**
     * Multiple instances of the worker API service.
     */
    worker: {
      /**
       * Path to the domain class, which orchestrates the worker API services.
       */
      domainPath: string
      /**
       * How many instances of the worker API service to create.
       */
      instances?: number
    }
  }
  /**
   * Fetcher service configuration.
   */
  fetcher?: {
    /**
     * Whether to enable the fetcher API. @todo: (For development purposes only?)
     */
    api?: boolean
    /**
     * How many instances of the fetcher service to create.
     */
    instances?: number
    /**
     * Offset subfix in case that other instances where instantiated on a different machine.
     */
    instanceOffset?: number
    /**
     * Directory to which the fetcher service will write the fetcher state. (@todo: Only state or txn too?)
     */
    dataPath?: string
  }
  /**
   * Parser service configuration.
   */
  parser?: {
    /**
     * Whether to enable the parser API. @todo: (For development purposes only?)
     */
    api?: boolean
    /**
     * How many instances of the parser service to create.
     */
    instances?: number
    /**
     * Offset subfix in case that other instances where instantiated on a different machine.
     */
    instanceOffset?: number
    /**
     * Directory to which the parser service will write the parsed data. (@todo: Is this correct?)
     */
    dataPath?: string
    /**
     * Directory in which the parser service will receive a custom buffer layouts schema for accounts and instructions
     */
    layoutPath?: string
  }
}

/**
 * The SDK class is the entry point to the framework.
 * Call init() to initialize the indexer.
 */
export class SDK {
  private defaultDataPath = 'data'
  private apiEndpoints: GraphQLEndpoint[] = []

  /**
   * Initializes the indexer. Generates configs for the services,
   * creates workers and starts the services.
   * @param config The configuration to initialize the indexer with.
   */
  async init(config: IndexerConfig): Promise<void> {
    initThreadContext()

    // @todo: External transport (thread by default)
    config.transport = config.transport || TransportType.Thread

    const { projectId, transport, transportConfig } = config
    const args = {
      projectId,
      transport,
      transportConfig,
      dataPath: this.defaultDataPath,
    }

    const indexers = config.indexer
      ? Array.from({ length: config.indexer.worker.instances || 1 }).map(
          (_, i) =>
            ({
              ...args,
              kind: WorkerKind.Indexer,
              name: `${projectId}-${WorkerKind.Indexer}-${i}`,
              domainPath: config.indexer?.worker.domainPath,
              dataPath: config.indexer?.dataPath || args.dataPath,
            } as WorkerInfo),
        )
      : []

    const parsers = config.parser
      ? Array.from({ length: config.parser.instances || 1 }).map(
          (_, i) =>
            ({
              ...args,
              kind: WorkerKind.Parser,
              name: `${projectId}-${WorkerKind.Parser}-${
                i + (config.parser?.instanceOffset || 0)
              }`,
              dataPath: config.parser?.dataPath || args.dataPath,
              layoutPath: config.parser?.layoutPath,
            } as WorkerInfo),
        )
      : []

    const fetchers = config.fetcher
      ? Array.from({ length: config.fetcher.instances || 1 }).map(
          (_, i) =>
            ({
              ...args,
              kind: WorkerKind.Fetcher,
              name: `${projectId}-${WorkerKind.Fetcher}-${
                i + (config.fetcher?.instanceOffset || 0)
              }`,
              dataPath: config.fetcher?.dataPath || args.dataPath,
            } as WorkerInfo),
        )
      : []

    if (
      transport === TransportType.Thread &&
      (indexers.length < 1 || parsers.length < 1 || fetchers.length < 1)
    ) {
      throw new Error(
        'If selected transport is "Thread" (default) there should be at least one instance of each kind of service: "fetcher", "parser" and "indexer" properly configured to be instantiated',
      )
    }

    const mains = []

    if (indexers.length > 0) {
      mains.push({
        kind: WorkerKind.Main,
        name: `${projectId}-${WorkerKind.Indexer}-${WorkerKind.Main}`,
      })
    }

    if (parsers.length > 0) {
      mains.push({
        kind: WorkerKind.Main,
        name: `${projectId}-${WorkerKind.Parser}-${WorkerKind.Main}`,
      })
    }

    if (fetchers.length > 0) {
      mains.push({
        kind: WorkerKind.Main,
        name: `${projectId}-${WorkerKind.Fetcher}-${WorkerKind.Main}`,
      })
    }

    // @note: This instantiate all workers returning the matrix of all possible message channels
    const allLocalChannels = createWorkers([
      ...fetchers,
      ...parsers,
      ...indexers,
      ...mains,
    ])

    await this.initMainFetcher(config, allLocalChannels, fetchers)
    await this.initMainIndexer(config, allLocalChannels, indexers)
    this.initApi(config)
  }

  /**
   * Initializes the main indexer service. It starts the local broker and
   * waits for all workers to be ready. It then imports the domain class, passed
   * as a config parameter, and calls the init() method on it. If an
   * apiSchemaPath is passed, it will create an API schema and append endpoints,
   * but will NOT start the API.
   * @param config The configuration to initialize the main indexer service with.
   * @param channels The matrix of all possible message channels.
   * @param indexers List of all available workers and their state
   * @private
   */
  private async initMainIndexer(
    config: IndexerConfig,
    channels: AllWorkerChannels,
    indexers: WorkerInfo[],
  ): Promise<void> {
    if (!config.indexer) return

    const { projectId, transport } = config
    const { domainPath, apiSchemaPath } = config.indexer.main

    const mainName = `${projectId}-${WorkerKind.Indexer}-${WorkerKind.Main}`

    const localBroker = getMoleculerBroker(mainName, TransportType.Thread, {
      channels: channels[mainName],
    })

    const indexerMsClient = new IndexerMsClient(localBroker)

    await localBroker.start()

    const indexersNames = indexers.map(({ name }) => name)
    await indexerMsClient.waitForAll(indexersNames)

    const dataPath = path.join(
      config.indexer?.dataPath || this.defaultDataPath,
      WorkerKind.Main,
    )

    const DomainClass = (await import(domainPath)).default
    const domain = new DomainClass({
      apiClient: indexerMsClient,
      dataPath,
      projectId,
      transport,
    } as IndexerMainDomainContext)

    if (domain.init) await domain.init()

    if (apiSchemaPath) {
      const SchemaClass = (await import(apiSchemaPath)).default
      const schema = new SchemaClass(domain)
      this.apiEndpoints.push(new GraphQLEndpoint('/', [schema], true))
    }
  }

  /**
   * @todo: This is very similar to initMainIndexer. Can we refactor?
   */
  private async initMainFetcher(
    config: IndexerConfig,
    channels: AllWorkerChannels,
    fetchers: WorkerInfo[],
  ): Promise<void> {
    if (!config.fetcher) return

    const { projectId } = config
    const { api } = config.fetcher

    const mainName = `${projectId}-${WorkerKind.Fetcher}-${WorkerKind.Main}`

    const localBroker = getMoleculerBroker(mainName, TransportType.Thread, {
      channels: channels[mainName],
    })

    const fetcherMsClient = new FetcherMsClient(localBroker)

    //@todo: two times? (see initMainIndexer)
    await localBroker.start()

    const indexersNames = fetchers.map(({ name }) => name)
    await fetcherMsClient.waitForAll(indexersNames)

    const dataPath = path.join(
      config.fetcher?.dataPath || this.defaultDataPath,
      WorkerKind.Main,
    )

    const DomainClass = FetcherMainDomain
    const domain = new DomainClass({
      apiClient: fetcherMsClient,
      dataPath,
    } as FetcherMainDomainContext)

    // if (domain.init) await domain.init()

    if (api !== false) {
      const SchemaClass = FetcherAPISchema
      const schema = new SchemaClass(domain)

      this.apiEndpoints.push(new GraphQLEndpoint('/fetcher', [schema], true))
    }
  }

  private initApi(config: IndexerConfig): void {
    const { apiPort } = config
    if (!this.apiEndpoints.length) return

    const graphQLServer = new GraphQLServer([], this.apiEndpoints)
    graphQLServer.start(apiPort)
  }
}

const sdk = new SDK()
export default sdk
