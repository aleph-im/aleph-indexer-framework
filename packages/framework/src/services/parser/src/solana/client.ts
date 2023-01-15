import {
  SolanaRawTransaction,
  SolanaParsedTransactionV1,
  RawAccountInfo,
  ParsedAccountInfoV1,
  SolanaRawInstruction,
  SolanaParsedInstructionV1,
} from '@aleph-indexer/core'
import { BlockchainRequestArgs } from '../../../types.js'
import { BaseParserClient } from '../base/client.js'
import { ParseInstructionRequestArgs } from './types.js'

export default class SolanaParserClient extends BaseParserClient<
  SolanaRawTransaction,
  SolanaParsedTransactionV1,
  RawAccountInfo,
  ParsedAccountInfoV1
> {
  async parseInstruction(
    args: Omit<
      ParseInstructionRequestArgs<SolanaRawInstruction>,
      keyof BlockchainRequestArgs
    >,
  ): Promise<SolanaRawInstruction | SolanaParsedInstructionV1> {
    return this.broker.call(`${this.msId}.parseInstruction`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }
}
