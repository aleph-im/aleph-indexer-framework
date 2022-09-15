import { BrokerOptions, ServiceBroker } from 'moleculer'
import { WorkerThreadsTransporter } from './transporterThread.js'
import { WorkerChannels } from '../workers.js'
import { FrameworkTCPTransporter } from './transporterTcp.js'

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
   * Will use the Aleph network to run the services as multiple processes on multiple machines, as needed.
   * [Not implemented]
   */
  P2PNet = 'P2PNet',
}

// const UINT32_MAX = Math.floor((2 ** 32 - 1) / 1000)
export const HEART_BEATS = 0 // 60 * 60 * 24

export const defaultBrokerConfig: BrokerOptions = {
  transporter: { type: 'Fake' },
  requestTimeout: 0,
  serializer: 'JSON',
  internalServices: false,
  logLevel: 'debug',
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
  opts: any,
): ServiceBroker {
  switch (transportType) {
    case TransportType.Thread: {
      return getThreadMoleculerBroker(nodeID, opts)
    }
    case TransportType.LocalNet: {
      const udpDiscovery = opts.urls ? false : true
      const urls = opts?.urls

      return getTCPMoleculerBroker(nodeID, {
        ...opts,
        urls,
        udpDiscovery,
      })
    }
    case TransportType.P2PNet: {
      return getTCPMoleculerBroker(nodeID, {
        ...opts,
        udpDiscovery: false,
        urls: [
          'tcp://51.159.101.87:7700/aleph-fetcher-0',
          'tcp://51.159.101.87:7800/aleph-parser-0',
        ],
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
  opts: { port?: number; urls: string | string[] },
): ServiceBroker {
  return new ServiceBroker({
    ...defaultBrokerConfig,
    transporter: new FrameworkTCPTransporter(nodeID, opts),
    nodeID,
  })
}
