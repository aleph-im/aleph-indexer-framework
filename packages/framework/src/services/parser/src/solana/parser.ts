import { SolanaTransactionParser } from './transaction/transactionParser.js'
import { BaseParser } from '../base/parser.js'
import {
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from '../base/types.js'
import { SolanaInstructionParser } from './instruction/instructionParser.js'
import { SolanaAccountStateParser } from './accountState/accountStateParser.js'
import {
  ParsedAccountInfoV1,
  RawAccountInfo,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
  SolanaRawInstruction,
  SolanaRawTransaction,
} from '../../../../types/solana.js'

export class SolanaParser extends BaseParser<
  SolanaRawTransaction,
  SolanaParsedTransaction,
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
  ): Promise<SolanaRawTransaction | SolanaParsedTransaction> {
    return this.transactionParser.parse(args.tx)
  }

  async parseInstruction(
    payload: SolanaRawInstruction,
  ): Promise<SolanaRawInstruction | SolanaParsedInstruction> {
    return this.instructionParser.parse(payload)
  }

  async parseAccountState(
    args: ParseAccountStateRequestArgs<RawAccountInfo>,
  ): Promise<RawAccountInfo | ParsedAccountInfoV1> {
    return this.accountStateParser.parse(args.state, args.account)
  }
}
