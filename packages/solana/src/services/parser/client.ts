import { ServiceBroker } from 'moleculer'
import {
  BaseParserClient,
  Blockchain,
  BlockchainRequestArgs,
  ParserClientI,
} from '@aleph-indexer/framework'
import {
  ParsedAccountInfoV1,
  RawAccountInfo,
  SolanaParsedInstruction,
  SolanaParsedTransaction,
  SolanaRawInstruction,
  SolanaRawTransaction,
} from '../../types.js'
import { ParseInstructionRequestArgs } from './src/types.js'

export default class SolanaParserClient extends BaseParserClient<
  SolanaRawTransaction,
  SolanaParsedTransaction,
  RawAccountInfo,
  ParsedAccountInfoV1
> {
  async parseInstruction(
    args: Omit<
      ParseInstructionRequestArgs<SolanaRawInstruction>,
      keyof BlockchainRequestArgs
    >,
  ): Promise<SolanaRawInstruction | SolanaParsedInstruction> {
    return this.broker.call(`${this.msId}.parseInstruction`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }
}

export async function solanaParserClientFactory(
  blockchainId: Blockchain,
  broker: ServiceBroker,
): Promise<
  ParserClientI<
    SolanaRawTransaction,
    SolanaParsedTransaction,
    RawAccountInfo,
    ParsedAccountInfoV1
  >
> {
  return new SolanaParserClient(blockchainId, broker)
}
