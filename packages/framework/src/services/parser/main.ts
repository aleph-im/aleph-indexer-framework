import { ServiceBroker } from 'moleculer'
import {
  ParsedTransactionV1,
  ParsedInstructionV1,
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

  async onTxs(chunk: RawTransaction[]): Promise<void> {
    // console.log(`📩 ${chunk.length} txs received by the parser...`)

    const parsedTxs: ParsedTransactionV1[] = []

    for (const tx of chunk) {
      try {
        const result = await this.parseTransaction(tx)
        parsedTxs.push(result)
      } catch (e) {
        console.error(e)
        continue
      }
    }

    await this.emitTransactions(parsedTxs)
  }

  async parseTransaction(
    payload: RawTransaction,
  ): Promise<ParsedTransactionV1> {
    return this.transactionParser.parse(payload)
  }

  async parseInstruction(
    payload: RawInstruction,
  ): Promise<RawInstruction | ParsedInstructionV1> {
    return await this.instructionParserLibrary.parse(payload)
  }

  async parseAccountData(
    account: string,
    payload: RawAccountInfo,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    return await this.accountParserLibrary.parse(payload, account)
  }

  protected async emitTransactions(txs: ParsedTransactionV1[]): Promise<void> {
    if (!txs.length) return

    console.log(`✉️  ${txs.length} txs sent by the parser...`)

    const txGroups = this.groupTransactions(txs)
    const groups = this.getClientEventGroups()

    await Promise.all(
      groups.flatMap((group) =>
        Object.entries(txGroups).map(([partitionKey, txs]) =>
          this.emitToClients('txs', txs, { group, partitionKey }),
        ),
      ),
    )

    // return this.broadcastToClients('txs', txs)
    // return this.broker.broadcast('parser.txs', txs, [MsIds.Indexer])
  }

  protected groupTransactions(
    txs: ParsedTransactionV1[],
  ): Record<string, ParsedTransactionV1[]> {
    return txs.reduce((acc, tx) => {
      tx.parsed.message.accountKeys.forEach(({ pubkey }) => {
        const byAccount = acc[pubkey] || (acc[pubkey] = [])
        byAccount.push(tx)
      })
      return acc
    }, {} as Record<string, ParsedTransactionV1[]>)
  }
}
