import { BrokerOptions, ServiceBroker } from 'moleculer'
import { WorkerThreadsTransporter } from './transporterThread.js'
import { WorkerChannels } from '../workers.js'
import { FrameworkTCPTransporter } from './transporterTcp.js'
import { FrameworkNatsTransporter } from './transporterNats.js'

/**
 * Describes the transport layer type which Moleculer will use.
 */
export enum TransportType {
  /**
   * Uses a single process to run the services.
   */
  Thread = 'Thread',
  /**
   * Uses the local machine's TCP protocol to run the services as multiple processes on one machine.
   * Each worker will run in its own process and is assigned a unique port.
   */
  LocalNet = 'LocalNet',
  /**
   * Will use a nats server for allowing to run the services as multiple processes on multiple machines, as needed.
   */
  Nats = 'Nats',
}

// const UINT32_MAX = Math.floor((2 ** 32 - 1) / 1000)
export const HEART_BEATS = 0 // 60 * 60 * 24

export const defaultBrokerConfig: BrokerOptions = {
  transporter: { type: 'Fake' },
  requestTimeout: 0,
  serializer: 'ProtoBuf',
  internalServices: false,
  logLevel: 'warn',
  cacher: 'Memory',
  validator: false,
  heartbeatInterval: HEART_BEATS,
  heartbeatTimeout: HEART_BEATS,
  retryPolicy: {
    enabled: true,
    retries: Number.MAX_SAFE_INTEGER,
  },
  registry: {
    discoverer: {
      type: 'Local',
      options: {
        disableHeartbeatChecks: true,
        disableOfflineNodeRemoving: true,
        heartbeatInterval: HEART_BEATS,
        heartbeatTimeout: HEART_BEATS,
      },
    },
  },
}

export function getMoleculerBroker(
  nodeID: string,
  transportType: TransportType,
  opts: {
    channels: WorkerChannels
    transportConfig?: {
      tcpUrls?: string | string[]
      natsUrl?: string
    }
  },
): ServiceBroker {
  switch (transportType) {
    case TransportType.Thread: {
      return getThreadMoleculerBroker(nodeID, opts)
    }
    case TransportType.LocalNet: {
      const urls = opts?.transportConfig?.tcpUrls || null
      const udpDiscovery = urls ? false : true

      return getTCPMoleculerBroker(nodeID, {
        urls,
        udpDiscovery,
      })
    }
    case TransportType.Nats: {
      const url = opts?.transportConfig?.natsUrl as string

      return getNatsMoleculerBroker(nodeID, {
        url,
      })
    }
  }
}

export function getThreadMoleculerBroker(
  nodeID: string,
  opts: { channels: WorkerChannels },
): ServiceBroker {
  return new ServiceBroker({
    ...defaultBrokerConfig,
    transporter: new WorkerThreadsTransporter(nodeID, opts.channels),
    nodeID,
  })
}

export function getTCPMoleculerBroker(
  nodeID: string,
  opts: { udpDiscovery: boolean; urls: string | string[] | null },
): ServiceBroker {
  return new ServiceBroker({
    ...defaultBrokerConfig,
    transporter: new FrameworkTCPTransporter(nodeID, opts),
    nodeID,
  })
}

export function getNatsMoleculerBroker(
  nodeID: string,
  opts: { url: string },
): ServiceBroker {
  return new ServiceBroker({
    ...defaultBrokerConfig,
    transporter: new FrameworkNatsTransporter(nodeID, opts),
    nodeID,
  })
}
