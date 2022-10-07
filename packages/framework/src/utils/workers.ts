import path from 'path'
import { fileURLToPath } from 'url'
import { MessageChannel, MessagePort, Worker } from 'worker_threads'
import { TransportType } from './moleculer/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Currently there exist 4 types of workers:
 */
export enum WorkerKind {
  /**
   * Worker that is exposing the GraphQL API and orchestrating the other workers
   */
  Main = 'main',
  /**
   * Worker that is fetching data from the blockchain and passing it to the parser
   */
  Fetcher = 'fetcher',
  /**
   * Worker that is parsing data from the blockchain and passing it to the indexer
   */
  Parser = 'parser',
  /**
   * Worker that is requesting data from the fetcher, while aggregating, transforming and storing received data
   */
  Indexer = 'indexer',
}

/**
 * Describes a worker instance.
 */
export type WorkerInfo = {
  /**
   * Name of the project the worker is running for.
   */
  projectId: string
  /**
   * Type of the transport the worker is using.
   */
  transport: TransportType
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
   * Path to the worker's data directory.
   */
  dataPath: string
  /**
   * Type of the worker.
   */
  kind: WorkerKind
  /**
   * Name of the worker.
   */
  name: string
  /**
   * Path to the worker's domain class, if any.
   */
  domainPath?: string
  /**
   * @todo: what is this?
   */
  channels: WorkerChannels
  /**
   * @todo: what is this?
   */
  layoutPath?: string
}

/**
 * Config to be passed to {@link createWorker}.
 */
export type WorkerConfig = {
  /**
   * The kind of worker to create.
   */
  kind: WorkerKind
  /**
   * The unique name of the worker to create.
   */
  name: string
}

/**
 * Contains the port for communicating with a worker.
 */
export type WorkerChannel = {
  /**
   * The kind of worker the channel is connecting to.
   */
  kind: WorkerKind
  /**
   * The port for communicating with the worker.
   */
  port: MessagePort
}

/**
 * A record of all workers and their available {@link WorkerChannel}s.
 */
export type AllWorkerChannels = Record<string, Record<string, WorkerChannel>>

/**
 * A record of workers and their according {@link WorkerChannel}s.
 */
export type WorkerChannels = Record<string, WorkerChannel>

/**
 * Bootstraps the workers given the list of configurations. Returns a map of
 * worker names to its channels connecting it to the other workers, making them
 * fully connected. Each worker has its own port. @todo: is this correct?
 * @param configs List of worker names and types.
 */
export function createWorkers(configs: WorkerConfig[]): AllWorkerChannels {
  const channels = createAllChannels(configs)

  for (const conf of configs) {
    if (conf.kind === WorkerKind.Main) continue
    createWorker(conf, channels[conf.name])
  }

  return channels
}

function createAllChannels(configs: WorkerConfig[]): AllWorkerChannels {
  // @note: Record<ORIGIN, Record<REMOTE, port>>
  const channels: AllWorkerChannels = {}

  for (const a of configs) {
    for (const b of configs) {
      // @note: do not create a channel for communicating with itself
      if (a.name === b.name) continue

      const channel = new MessageChannel()
      const { port1, port2 } = channel

      const fromAtoB = (channels[a.name] = channels[a.name] || {})
      fromAtoB[b.name] = { port: port1, kind: b.kind }

      const fromBtoA = (channels[b.name] = channels[b.name] || {})
      fromBtoA[a.name] = { port: port2, kind: a.kind }
    }
  }

  return channels
}

function createWorker(conf: WorkerConfig, channels?: WorkerChannels) {
  const src = path.join(__dirname, `../workers/${conf.kind}.js`)

  return new Worker(src, {
    workerData: { ...conf, channels },
    transferList: [...Object.values(channels || {}).map((c) => c.port)],
  })
}
