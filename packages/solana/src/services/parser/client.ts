import { ServiceBroker } from 'moleculer'
import {
  BaseParserClient,
  BlockchainId,
  BlockchainRequestArgs,
  ParserClientI,
} from '@aleph-indexer/framework'
import {
  SolanaParsedInstruction,
  SolanaParsedTransaction,
  SolanaRawInstruction,
  SolanaRawTransaction,
} from '../../types.js'
import { ParseInstructionRequestArgs } from './src/types.js'

export default class SolanaParserClient extends BaseParserClient<
  SolanaRawTransaction,
  SolanaParsedTransaction
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
  blockchainId: BlockchainId,
  broker: ServiceBroker,
): Promise<ParserClientI<SolanaRawTransaction, SolanaParsedTransaction>> {
  return new SolanaParserClient(blockchainId, broker)
}
