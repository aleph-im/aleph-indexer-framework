import { GenericObject, Transit, Transporters } from 'moleculer'
import { WorkerChannels } from '../workers.js'

/**
 * Transporter facilitating communication between workers through sending
 * messages over MessagePorts.
 */
export class WorkerThreadsTransporter extends Transporters.Base {
  constructor(protected id: string, protected channels: WorkerChannels) {
    super()
  }

  init(
    transit: Transit,
    messageHandler: (cmd: string, msg: string) => void,
    afterConnect: (wasReconnect: boolean) => void,
  ): void {
    super.init(transit, messageHandler, afterConnect)

    const { discoverer } = this as any

    if (discoverer) {
      discoverer.disableHeartbeat()
    }
  }

  async connect(): Promise<void> {
    return this.onConnected()
  }

  async disconnect(): Promise<void> {
    // NOOP
  }

  async subscribe(cmd: string, nodeID: string): Promise<void> {
    const subTopic = this.getTopicName(cmd, nodeID)

    for (const channel of Object.values(this.channels)) {
      channel.port.on('message', ({ topic, data }) => {
        if (topic !== subTopic) return
        this.receive(cmd, Buffer.from(data))
      })
    }
  }

  async send(topic: string, data: Buffer, meta: GenericObject): Promise<void> {
    const target = meta?.packet?.target

    if (target) {
      const targetChannel = this.channels[target]
      if (!targetChannel) throw new Error('target not found ' + target)
      targetChannel.port.postMessage({ topic, data })
      return
    }

    for (const channel of Object.values(this.channels)) {
      channel.port.postMessage({ topic, data })
    }
  }
}
