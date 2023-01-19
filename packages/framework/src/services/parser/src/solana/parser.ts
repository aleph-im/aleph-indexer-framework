import {
  SolanaParsedInstructionV1,
  ParsedAccountInfoV1,
  SolanaRawTransaction,
  SolanaRawInstruction,
  RawAccountInfo,
  SolanaParsedTransactionV1,
} from '@aleph-indexer/core'
import { SolanaTransactionParser } from './transaction/transactionParser.js'
import { BaseParser } from '../base/parser.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from '../base/types.js'
import { SolanaInstructionParser } from './instruction/instructionParser.js'
import { SolanaAccountStateParser } from './accountState/accountStateParser.js'

export class SolanaParser extends BaseParser<
  SolanaRawTransaction,
  SolanaParsedTransactionV1,
  RawAccountInfo,
  ParsedAccountInfoV1
> {
  constructor(
    protected instructionParser: SolanaInstructionParser,
    protected transactionParser: SolanaTransactionParser,
    protected accountStateParser: SolanaAccountStateParser,
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
    return this.instructionParser.parse(payload)
  }

  async parseAccountState(
    args: ParseAccountStateRequestArgs<RawAccountInfo>,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    return this.accountStateParser.parse(args.state, args.account)
  }
}
