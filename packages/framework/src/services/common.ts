import { Service, ServiceBroker } from 'moleculer'
import { EventEmitter } from 'events'
import { Utils } from '@aleph-indexer/core'

export const MOLECULER_MULTIPLEXED_EVENT_CHANNEL = 'multiplexed_event_channel'

/**
 * Enum of the service types.
 */
export enum MsIds {
  Fetcher = 'fetcher_ms',
  Parser = 'parser_ms',
  Indexer = 'indexer_ms',
}

export const shardBalancingStrategy = {
  strategy: 'Shard',
  strategyOptions: {
    shardKey: 'partitionKey',
  },
}

/**
 * Returns the service IDs for the given service type.
 * @param broker The service broker to query.
 * @param service The type of services to find.
 */
export function getRegistryNodesWithService(
  broker: ServiceBroker,
  service: MsIds,
): string[] {
  const nodes = broker.registry.nodes.nodes
  const nodesArr = nodes
    ? Array.from((nodes as Map<string, any>).entries())
    : []

  return nodesArr
    .filter(
      ([, node]) =>
        node.available &&
        node.rawInfo.services.find((s: any) => s.name === service),
    )
    .map(([name]) => name)
}

/**
 * Returns a promise which resolves when all services of given type are ready.
 * @param broker The service broker to query.
 * @param nodes The node IDs to wait for. Should be of the given service type.
 * NOTE: Function will wait for all provided nodes, even if they are not of given service type.
 * @param service The type of the services being awaited.
 */
export async function waitForAllNodesWithService(
  broker: ServiceBroker,
  nodes: string[],
  service: MsIds,
): Promise<void> {
  let nodesReady = false

  while (!nodesReady) {
    nodesReady = nodes.every((name) => {
      const node = broker.registry.nodes.nodes.get(name)

      const isReady =
        !!node &&
        node.available &&
        !!node.rawInfo.services.find((s: any) => s.name === service)

      console.log(
        `⚙️ service ${service} ready? `,
        name,
        isReady,
        node?.rawInfo?.services,
      )

      return isReady
    })

    if (!nodesReady) await Utils.sleep(1000)
  }

  return
}

/**
 * Returns the service type string appended with '_client'.
 * Used to receive events on clients running on another node.
 * @param msId The service type.
 */
export function getClientMsId(msId: MsIds): string {
  return `${msId}_client`
}

/**
 * Interface for factory functions which create a service for a broker.
 */
export type MainFactory<M> = (broker: ServiceBroker) => M

type EventPayload<Event> = {
  eventId: Event
  payload: any
}

export type EventOptions = {
  group?: string
  balancingStrategy?: { strategy: string; strategyOptions: any }
}

/**
 * Interface for a service which can emit events of a given type.
 * @todo: Angel, please inspect these docs and make sure they are correct.
 */
export class MsClientWithEvents<Event extends string = string> {
  private static _emitter: EventEmitter = new EventEmitter()
  private static _localClientMs: Service

  protected _self = this.constructor as typeof MsClientWithEvents

  /**
   * Creates a new service client which can emit events of the given type.
   * @param broker The service broker to connect the client to.
   * @param id The service type of the client.
   * @param initService Whether to initialize the service on the broker.
   */
  constructor(
    protected broker: ServiceBroker,
    protected id: MsIds,
    protected initService = true,
    protected eventOpts?: EventOptions,
  ) {
    if (initService) this._initLocalClientMs()
  }

  /**
   * Adds a hook to the given event.
   * @param eventId Event type to listen for.
   * @param handler Function to call when event is emitted.
   */
  on(eventId: Event, handler: (payload: any) => any): this {
    if (!this.initService)
      throw new Error(`Events are disabled on ${this.id} client`)

    console.log(`Registered new event on ${this.id} (${eventId})`)

    this._self._emitter.on(eventId, handler)

    return this
  }

  off(eventId: Event, handler: (payload: any) => any): this {
    if (!this.initService)
      throw new Error(`Events are disabled on ${this.id} client`)

    console.log(`Unregistering event on ${this.id} (${eventId})`)

    this._self._emitter.off(eventId, handler)

    return this
  }

  private _multiplexedHandler(ctx: EventPayload<Event>) {
    this._self._emitter.emit(ctx.eventId, ctx.payload)
  }

  private _initLocalClientMs() {
    const name = getClientMsId(this.id)

    if (!this._self._localClientMs) {
      const handler = this._multiplexedHandler.bind(this)
      const eventOpts = this.eventOpts

      if (eventOpts?.balancingStrategy) {
        const strategyOptions = eventOpts?.balancingStrategy.strategyOptions

        eventOpts.balancingStrategy = {
          ...eventOpts?.balancingStrategy,
          strategyOptions: {
            ...strategyOptions,
            shardKey: `#${strategyOptions.shardKey}`,
          },
        }
      }

      this._self._localClientMs = this.broker.createService(
        class extends Service {
          constructor(broker: ServiceBroker) {
            super(broker)

            console.log('this.eventOpts', eventOpts)
            this.parseServiceSchema({
              name,
              events: {
                [`${name}.${MOLECULER_MULTIPLEXED_EVENT_CHANNEL}`]: {
                  ...eventOpts,
                  handler,
                },
              },
            })
          }
        },
      )
    }
  }
}

/**
 * Class for a service which can emit events of any kind to a certain other
 * type of service.
 */
export class MsMainWithEvents {
  private _EVENT_CHANNEL!: string

  /**
   * @param broker The service broker to emit events on.
   * @param msId The service type to emit events for.
   */
  constructor(protected broker: ServiceBroker, protected msId: MsIds) {
    const name = getClientMsId(msId)
    this._EVENT_CHANNEL = `${name}.${MOLECULER_MULTIPLEXED_EVENT_CHANNEL}`
  }

  getClientEventGroups(): string[] {
    return this.broker.getEventGroups(this._EVENT_CHANNEL)
  }

  async emitToClients(
    event: string,
    data?: any,
    opts?: {
      group?: string
      partitionKey?: string
    },
  ): Promise<void> {
    const payload: any = {
      eventId: event,
      payload: data,
    }

    const groups = [opts?.group || getClientMsId(this.msId)]
    const options = { groups, meta: { partitionKey: opts?.partitionKey } }

    return this.broker
      .emit(this._EVENT_CHANNEL, payload, options)
      .catch((e) => 'ignore' && console.error(e))
  }

  async broadcastToClients(event: string, data?: any): Promise<void> {
    const payload: any = {
      eventId: event,
      payload: data,
    }

    const groups = [getClientMsId(this.msId)]

    return this.broker
      .broadcast(this._EVENT_CHANNEL, payload, groups)
      .catch((e) => 'ignore' && console.error(e))
  }
}
