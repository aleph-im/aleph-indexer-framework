import {
  SolanaParsedInnerInstructionV1,
  SolanaParsedInstructionV1,
  SolanaParsedTransactionV1,
} from '../../types'
import { ParsedTransactionContextV1 } from '../base/index.js'

export type SolanaParsedTransactionContextV1 =
  ParsedTransactionContextV1<SolanaParsedTransactionV1>

export type SolanaInstructionContextV1 = {
  txContext: SolanaParsedTransactionContextV1
  parentIx?: SolanaParsedInstructionV1
  ix: SolanaParsedInstructionV1 | SolanaParsedInnerInstructionV1
}
