import { Packet, Transporters } from 'moleculer'
import { isNodeIdAllowed } from './utils.js'

// @note: Type problems overriding methods
const SuperClass: any = Transporters.TCP

/**
 * Transporter facilitating communication between workers through sending
 * messages over MessagePorts.
 */
export class FrameworkTCPTransporter extends SuperClass {
  constructor(protected nodeID: string, opts: any = {}) {
    super({
      ...opts,
      ...{
        // // Enable UDP discovery
        // udpDiscovery: true,
        // // Reusing UDP server socket
        // udpReuseAddr: true,
        // // UDP port
        // udpPort: 4445,
        // // UDP bind address (if null, bind on all interfaces)
        // udpBindAddress: null,
        // // UDP sending period (seconds)
        // udpPeriod: 30,
        // // Multicast address.
        // udpMulticast: '239.0.0.0',
        // // Multicast TTL setting
        // udpMulticastTTL: 1,
        // // Send broadcast (Boolean, String, Array<String>)
        // udpBroadcast: false,
        // // TCP server port. Null or 0 means random port
        // port: null,
        // // Static remote nodes address list (when UDP discovery is not available)
        // urls: null,
        // // Use hostname as preffered connection address
        // useHostname: true,
        // // Gossip sending period in seconds
        // gossipPeriod: 2,
        gossipPeriod: 30,
        // // Maximum enabled outgoing connections. If reach, close the old connections
        // maxConnections: 32,
        // @note: This is a quick dirty fix (Maximum TCP packet size)
        // @todo: Include a "limit" argument on fetcher api date pagination
        // Maximum TCP packet size
        // maxPacketSize: 99 * 1024 * 1024,
      },
    })
  }

  //@note: Filter usd discovery packets
  addOfflineNode(nodeID: string, host: string, port: number): any {
    const isAllowed = isNodeIdAllowed(this.nodeID, nodeID)
    if (!isAllowed) return {}

    return super.addOfflineNode(nodeID, host, port)
  }

  // @note: Doing this on deserialize for a better performance
  // async receive(type: string, message: Buffer, socket?: any): Promise<void>
  deserialize(type: string, buf: Buffer): (Packet & any) | null {
    const packet: any = super.deserialize(type, buf)

    const sender = packet?.payload.sender
    if (!sender) return packet

    const isAllowed = isNodeIdAllowed(sender, this.nodeID)
    if (!isAllowed) return null
    this.cleanGossipNodeLists(packet)

    return packet
  }

  async publish(packet: Packet & any): Promise<void> {
    const target = packet?.target
    if (!target) return

    const isAllowed = isNodeIdAllowed(this.nodeID, target)
    if (!isAllowed) return
    this.cleanGossipNodeLists(packet)

    return super.publish(packet)
  }

  protected cleanGossipNodeLists(packet: any): void {
    if (['GOSSIP_REQ', 'GOSSIP_RES', 'GOSSIP_HELLO'].includes(packet.type)) {
      this.cleanGossipNodeList(packet, 'online')
      this.cleanGossipNodeList(packet, 'offline')
      // console.log('AFTER clean', JSON.stringify(packet, null, 2))
    }
  }

  protected cleanGossipNodeList(packet: any, list: 'online' | 'offline'): void {
    const nodeList: Record<string, number[]> | undefined = packet.payload[list]
    if (!nodeList) return

    for (const target of Object.keys(nodeList)) {
      const source = packet.target || this.nodeID
      const allowed = isNodeIdAllowed(source, target)

      if (!allowed) {
        delete nodeList[target]
      }
    }

    if (Object.keys(nodeList).length === 0) {
      delete packet.payload[list]
    }
  }
}
