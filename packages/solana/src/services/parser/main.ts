import {
  BaseParser,
  ParseAccountStateRequestArgs,
  ParseTransactionRequestArgs,
} from '@aleph-indexer/framework'
import {
  SolanaRawTransaction,
  SolanaParsedTransaction,
  RawAccountInfo,
  ParsedAccountInfoV1,
  SolanaRawInstruction,
  SolanaParsedInstruction,
} from '../../types.js'
import { SolanaAccountStateParser } from './src/accountState/accountStateParser.js'
import { SolanaInstructionParser } from './src/instruction/instructionParser.js'
import { SolanaTransactionParser } from './src/transaction/transactionParser.js'

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
