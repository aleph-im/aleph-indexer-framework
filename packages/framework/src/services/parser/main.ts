import { ServiceBroker } from 'moleculer'
import {
  SolanaParsedTransactionV1,
  SolanaParsedInstructionV1,
  ParsedAccountInfoV1,
  RawTransaction,
  RawInstruction,
  RawAccountInfo,
} from '@aleph-indexer/core'
import { ParserMsI } from './interface.js'
import { TransactionParser } from './src/transactionParser.js'
import { AccountParserLibrary } from './src/accountParserLibrary.js'
import { InstructionParserLibrary } from './src/instructionParserLibrary.js'
import { MsIds, MsMainWithEvents } from '../common.js'
import { ParsedTransactionMsg, RawTransactionMsg } from './src/types.js'

export class ParserMsMain extends MsMainWithEvents implements ParserMsI {
  constructor(
    protected broker: ServiceBroker,
    protected layoutPath?: string,
    protected instructionParserLibrary: InstructionParserLibrary = new InstructionParserLibrary(
      layoutPath,
    ),
    protected accountParserLibrary: AccountParserLibrary = new AccountParserLibrary(),
    protected transactionParser: TransactionParser = new TransactionParser(
      instructionParserLibrary,
    ),
  ) {
    super(broker, MsIds.Parser)
  }

  async onTxs(chunk: RawTransactionMsg[]): Promise<void> {
    // console.log(`📩 ${chunk.length} txs received by the parser...`)

    const parsedMsgs: ParsedTransactionMsg[] = []

    for (const msg of chunk) {
      try {
        const [rawTx, peers] =
          'peers' in msg ? [msg.tx, msg.peers] : [msg, undefined]

        const parsedTx = await this.parseTransaction(rawTx)
        const parsedMsg = { peers, tx: parsedTx }

        parsedMsgs.push(parsedMsg)
      } catch (e) {
        console.error(e)
        continue
      }
    }

    await this.emitTransactions(parsedMsgs)
  }

  async parseTransaction(
    payload: RawTransaction,
  ): Promise<SolanaParsedTransactionV1> {
    return this.transactionParser.parse(payload)
  }

  async parseInstruction(
    payload: RawInstruction,
  ): Promise<RawInstruction | SolanaParsedInstructionV1> {
    return await this.instructionParserLibrary.parse(payload)
  }

  async parseAccountData(
    account: string,
    payload: RawAccountInfo,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    return await this.accountParserLibrary.parse(payload, account)
  }

  protected async emitTransactions(
    msgs: ParsedTransactionMsg[],
  ): Promise<void> {
    if (!msgs.length) return

    console.log(`✉️  ${msgs.length} txs sent by the parser...`)

    const [groups, broadcast] = this.groupTransactions(msgs)
    const txGroups = Object.entries(groups)

    if (txGroups.length > 0) {
      await Promise.all(
        txGroups.map(([group, txs]) =>
          this.emitToClients('txs', txs, { group }),
        ),
      )
    }

    if (broadcast.length > 0) {
      return this.broadcastToClients('txs', broadcast)
    }

    // return this.broadcastToClients('txs', txs)
    // return this.broker.broadcast('parser.txs', txs, [MsIds.Indexer])
  }

  protected groupTransactions(
    msgs: ParsedTransactionMsg[],
  ): [
    Record<string, SolanaParsedTransactionV1[]>,
    SolanaParsedTransactionV1[],
  ] {
    const broadcastGroup: SolanaParsedTransactionV1[] = []

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
    }, {} as Record<string, SolanaParsedTransactionV1[]>)

    return [groups, broadcastGroup]
  }
}
