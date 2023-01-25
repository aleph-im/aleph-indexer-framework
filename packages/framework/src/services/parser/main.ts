import { ServiceBroker } from 'moleculer'
import { ParserMsI } from './interface.js'
import { MsIds, MsMainWithEvents } from '../common.js'
import {
  BlockchainParserI,
  ParseAccountStateRequestArgs,
  ParsedTransactionMsg,
  ParseTransactionRequestArgs,
  RawTransactionMsg,
} from './src/base/types.js'
import {
  Blockchain,
  ParsedTransaction,
  RawTransaction,
} from '../../types/common.js'

export class ParserMsMain<
    T extends RawTransaction = RawTransaction,
    PT extends ParsedTransaction<unknown> = ParsedTransaction<unknown>,
    S = unknown,
    PS = unknown,
  >
  extends MsMainWithEvents
  implements ParserMsI<T, PT, S, PS>
{
  constructor(
    protected broker: ServiceBroker,
    protected blockchains: Record<Blockchain, BlockchainParserI<T, PT, S, PS>>,
  ) {
    super(broker, MsIds.Parser)
  }

  async onTxs(
    blockchainId: Blockchain,
    chunk: RawTransactionMsg<T>[],
  ): Promise<void> {
    console.log(`📩 ${chunk.length} txs received by the parser...`)

    const parsedMsgs: ParsedTransactionMsg<T | PT>[] = []

    for (const msg of chunk) {
      try {
        const [tx, peers] =
          'peers' in msg ? [msg.tx, msg.peers] : [msg, undefined]

        const fetcher = this.getBlockchainInstance(blockchainId)
        const parsedTx = await fetcher.parseTransaction({ blockchainId, tx })
        const parsedMsg = { peers, tx: parsedTx }

        parsedMsgs.push(parsedMsg)
      } catch (e) {
        console.error(e)
        continue
      }
    }

    await this.emitTransactions(blockchainId, parsedMsgs)
  }

  async parseTransaction(
    args: ParseTransactionRequestArgs<T>,
  ): Promise<T | PT> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.parseTransaction(args)
  }

  async parseAccountState(
    args: ParseAccountStateRequestArgs<S>,
  ): Promise<S | PS> {
    const fetcher = this.getBlockchainInstance(args.blockchainId)
    return fetcher.parseAccountState(args)
  }

  protected async emitTransactions(
    blockchainId: Blockchain,
    msgs: ParsedTransactionMsg<T | PT>[],
  ): Promise<void> {
    if (!msgs.length) return

    console.log(`✉️  ${msgs.length} txs sent by the parser...`)

    const [groups, broadcast] = this.groupTransactions(msgs)
    const txGroups = Object.entries(groups)

    if (txGroups.length > 0) {
      await Promise.all(
        txGroups.map(([group, txs]) =>
          this.emitToClients(`parser.txs.${blockchainId}`, txs, { group }),
        ),
      )
    }

    if (broadcast.length > 0) {
      return this.broadcastToClients(`parser.txs.${blockchainId}`, broadcast)
    }

    // return this.broadcastToClients('txs', txs)
    // return this.broker.broadcast('parser.txs', txs, [MsIds.Indexer])
  }

  protected groupTransactions(
    msgs: ParsedTransactionMsg<T | PT>[],
  ): [Record<string, (T | PT)[]>, (T | PT)[]] {
    const broadcastGroup: (T | PT)[] = []

    const groups = msgs.reduce((acc, { tx, peers }) => {
      if (!peers || peers.length === 0) {
        broadcastGroup.push(tx)
        return acc
      }

      peers.forEach((peer) => {
        const byPeer = acc[peer] || (acc[peer] = [])
        byPeer.push(tx)
      })

      return acc
    }, {} as Record<string, (T | PT)[]>)

    return [groups, broadcastGroup]
  }

  protected getBlockchainInstance(
    blockchainId: Blockchain,
  ): BlockchainParserI<T, PT, S, PS> {
    const instance = this.blockchains[blockchainId]

    if (!instance) {
      throw new Error(`${blockchainId} blockchain not supported`)
    }

    return instance
  }
}
