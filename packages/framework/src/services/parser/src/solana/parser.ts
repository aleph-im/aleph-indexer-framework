import {
  SolanaParsedInstructionV1,
  ParsedAccountInfoV1,
  SolanaRawTransaction,
  SolanaRawInstruction,
  RawAccountInfo,
  SolanaParsedTransactionV1,
} from '@aleph-indexer/core'
import { InstructionParserLibrary } from './instructionParserLibrary.js'
import { AccountParserLibrary } from './accountParserLibrary.js'
import { TransactionParser } from './transactionParser.js'
import { BaseParser } from '../base/parser.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from '../base/types.js'

export class SolanaParser extends BaseParser<
  SolanaRawTransaction,
  SolanaParsedTransactionV1,
  RawAccountInfo,
  ParsedAccountInfoV1
> {
  constructor(
    protected instructionParserLibrary: InstructionParserLibrary,
    protected accountParserLibrary: AccountParserLibrary,
    protected transactionParser: TransactionParser,
  ) {
    super()
  }

  async parseTransaction(
    args: ParseTransactionRequestArgs<SolanaRawTransaction>,
  ): Promise<SolanaRawTransaction | SolanaParsedTransactionV1> {
    return this.transactionParser.parse(args.tx)
  }

  async parseInstruction(
    payload: SolanaRawInstruction,
  ): Promise<SolanaRawInstruction | SolanaParsedInstructionV1> {
    return this.instructionParserLibrary.parse(payload)
  }

  async parseAccountState(
    args: ParseAccountStateRequestArgs<RawAccountInfo>,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    return this.accountParserLibrary.parse(args.state, args.account)
  }
}
