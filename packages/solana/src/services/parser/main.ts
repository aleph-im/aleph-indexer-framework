import {
  BaseParser,
  IndexableEntityType,
  ParseEntityRequestArgs,
} from '@aleph-indexer/framework'
import {
  SolanaRawTransaction,
  SolanaParsedTransaction,
  SolanaRawInstruction,
  SolanaParsedInstruction,
} from '../../types.js'
import { SolanaAccountStateParser } from './src/accountState/accountStateParser.js'
import { SolanaInstructionParser } from './src/instruction/instructionParser.js'
import { SolanaTransactionParser } from './src/transaction/transactionParser.js'

export class SolanaParser extends BaseParser<
  SolanaRawTransaction,
  SolanaParsedTransaction
> {
  constructor(
    protected instructionParser: SolanaInstructionParser,
    protected transactionParser: SolanaTransactionParser,
    protected accountStateParser: SolanaAccountStateParser,
  ) {
    super()
  }

  async parseEntity(args: ParseEntityRequestArgs<any>): Promise<any> {
    if (args.type !== IndexableEntityType.Transaction) return
    return this.parseTransaction(args)
  }

  async parseTransaction(
    args: ParseEntityRequestArgs<SolanaRawTransaction>,
  ): Promise<SolanaRawTransaction | SolanaParsedTransaction> {
    return this.transactionParser.parse(args.entity)
  }

  async parseInstruction(
    payload: SolanaRawInstruction,
  ): Promise<SolanaRawInstruction | SolanaParsedInstruction> {
    return this.instructionParser.parse(payload)
  }
}
