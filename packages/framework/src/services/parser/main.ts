import { ServiceBroker } from 'moleculer'
import { ParserMsI } from './interface.js'
import { MsIds, MsMainWithEvents } from '../common.js'
import {
  BlockchainParserI,
  ParsedEntityMsg,
  ParseEntityRequestArgs,
  RawEntityMsg,
} from './src/types.js'
import {
  Blockchain,
  IndexableEntityType,
  ParsedEntity,
  RawEntity,
} from '../../types.js'

export class ParserMsMain<
    RE extends RawEntity = RawEntity,
    PE extends ParsedEntity<unknown> = ParsedEntity<unknown>,
  >
  extends MsMainWithEvents
  implements ParserMsI<RE, PE>
{
  constructor(
    protected broker: ServiceBroker,
    protected blockchains: Record<Blockchain, BlockchainParserI<RE, PE>>,
  ) {
    super(broker, MsIds.Parser)
  }

  async onEntities(
    type: IndexableEntityType,
    blockchainId: Blockchain,
    chunk: RawEntityMsg<RE>[],
  ): Promise<void> {
    console.log(`📩 ${chunk.length} txs received by the parser...`)

    const parsedMsgs: ParsedEntityMsg<RE | PE>[] = []

    for (const msg of chunk) {
      try {
        const fetcher = this.getBlockchainInstance(blockchainId)
        const { entity, peers } = msg

        const parsedEntity = await fetcher.parseEntity({
          blockchainId,
          type,
          entity,
        })

        const parsedMsg = { peers, type, entity: parsedEntity }

        parsedMsgs.push(parsedMsg)
      } catch (e) {
        console.error(e)
        continue
      }
    }

    await this.emitParsedEntities(type, blockchainId, parsedMsgs)
  }

  async parseEntity(args: ParseEntityRequestArgs<RE>): Promise<RE | PE> {
    const { type } = args

    if (type === IndexableEntityType.Transaction)
      return this.parseTransaction(args)
    else if (type === IndexableEntityType.State)
      return this.parseAccountState(args)

    return args.entity
  }

  async parseTransaction(args: ParseEntityRequestArgs<RE>): Promise<RE | PE> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.parseEntity(args)
  }

  async parseAccountState(args: any): Promise<RE | PE> {
    // @todo
    return args.entity
  }

  protected async emitParsedEntities(
    type: IndexableEntityType,
    blockchainId: Blockchain,
    msgs: ParsedEntityMsg<RE | PE>[],
  ): Promise<void> {
    if (!msgs.length) return

    console.log(`✉️  ${msgs.length} txs sent by the parser...`)

    const [groups, broadcast] = this.groupEntities(msgs)
    const txGroups = Object.entries(groups)

    if (txGroups.length > 0) {
      await Promise.all(
        txGroups.map(([group, txs]) =>
          this.emitToClients(`parser.${blockchainId}.${type}`, txs, { group }),
        ),
      )
    }

    if (broadcast.length > 0) {
      return this.broadcastToClients(
        `parser.${blockchainId}.${type}`,
        broadcast,
      )
    }
  }

  protected groupEntities(
    msgs: ParsedEntityMsg<RE | PE>[],
  ): [Record<string, (RE | PE)[]>, (RE | PE)[]] {
    const broadcastGroup: (RE | PE)[] = []

    const groups = msgs.reduce((acc, { entity, peers }) => {
      if (!peers || peers.length === 0) {
        broadcastGroup.push(entity)
        return acc
      }

      peers.forEach((peer) => {
        const byPeer = acc[peer] || (acc[peer] = [])
        byPeer.push(entity)
      })

      return acc
    }, {} as Record<string, (RE | PE)[]>)

    return [groups, broadcastGroup]
  }

  protected getBlockchainInstance(
    blockchainId: Blockchain,
  ): BlockchainParserI<RE, PE> {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }
}
