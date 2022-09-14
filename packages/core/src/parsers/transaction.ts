import cloneDeep from 'lodash-es/cloneDeep.js'
import {
  AlephParsedErrorIx,
  AlephParsedInstruction,
  AlephParsedTransaction,
  RawInstruction,
  RawTransactionV1,
} from '../types.js'
import { ProgramErrorType, TransactionErrorType } from '../utils/error.js'
import { Parser, Parsers } from './common.js'

// @todo: Remove this
export * from '../types.js'

export class TransactionParser extends Parser<
  RawTransactionV1,
  AlephParsedTransaction
> {
  parse(
    rawTx: RawTransactionV1 | AlephParsedTransaction,
  ): AlephParsedTransaction {
    // const parsedTx: AlephParsedTransaction = cloneDeep(rawTx) as any
    const parsedTx: AlephParsedTransaction = rawTx as any

    parsedTx.parsed = cloneDeep(parsedTx.transaction) as any

    this.parseError(parsedTx)
    this.parseErrorLegacy(parsedTx)

    if (parsedTx.parsed.message.instructions.length > 0) {
      this.parsePrograms(parsedTx)
    }

    return parsedTx
  }

  // @note: Take a look at:
  // https://github.com/solana-labs/solana/blob/master/sdk/src/transaction/error.rs#L13
  // https://github.com/solana-labs/solana/blob/master/sdk/program/src/program_error.rs#L12
  protected parseError(parsedTx: AlephParsedTransaction): void {
    if (!parsedTx.err) return

    const err = parsedTx.err as Record<string, [number, Record<string, number>]>

    const typeTxt = Object.keys(err)[0]
    const type = TransactionErrorType[
      typeTxt as any
    ] as unknown as TransactionErrorType

    parsedTx.parsed.error = { type }

    if (type === TransactionErrorType.InstructionError) {
      if (!Array.isArray(err.InstructionError)) return

      const [index, subErr] = err[typeTxt]

      const subTypeTxt =
        typeof subErr === 'string' ? subErr : Object.keys(subErr)[0]

      const subType = ProgramErrorType[
        subTypeTxt as any
      ] as unknown as ProgramErrorType

      const ix: AlephParsedErrorIx = {
        index,
        type: subType,
        customCode: subErr[subTypeTxt],
      }

      const logs = parsedTx?.meta?.logMessages || []
      let innerIndex = -2

      for (const log of logs) {
        if (log.indexOf(' failed') !== -1) break
        if (log.indexOf(' invoke') !== -1) innerIndex++
        else if (log.indexOf(' success') !== -1) innerIndex--
      }

      if (innerIndex >= 0) {
        ix.innerIndex = innerIndex
      }

      parsedTx.parsed.error.ix = ix
    }
  }

  protected parseErrorLegacy(parsedTx: AlephParsedTransaction): void {
    if (!parsedTx.err) return
    const err = parsedTx.err as Record<string, any>

    if (
      err.InstructionError !== undefined &&
      err.InstructionError.length == 2
    ) {
      const instErr = {
        code: err.InstructionError[0],
        info: err.InstructionError[1],
      }
      if (instErr.code.Custom !== undefined) {
        instErr.code = instErr.code.Custom
      }
      if (instErr.info.Custom !== undefined) {
        instErr.info = instErr.info.Custom
      }
      err.InstructionError = instErr
    }
  }

  protected parsePrograms(parsedTx: AlephParsedTransaction): void {
    const instructions = parsedTx.transaction.message.instructions
    const innerInstructions = parsedTx.meta?.innerInstructions || []
    const innerInstructionsMap = innerInstructions.reduce((acc, curr) => {
      acc[curr.index] = curr.instructions
      return acc
    }, {} as Record<number, RawInstruction[]>)

    const parsedIxs = instructions.map((rawIx, index) => {
      let resultIx = rawIx as AlephParsedInstruction

      const ixParser = this.getProgramParser(rawIx.programId)
      if (ixParser) {
        resultIx = ixParser.parse(rawIx) as AlephParsedInstruction
      }
      resultIx.index = index

      const innerIxs = innerInstructionsMap[index] || []

      if (innerIxs.length > 0) {
        resultIx.innerInstructions = []

        for (const rawIix of innerIxs) {
          let resultIix = rawIix as AlephParsedInstruction

          const ixParser = this.getProgramParser(rawIix.programId)
          if (ixParser) {
            resultIix = ixParser.parse(rawIix) as AlephParsedInstruction
          }

          const length = resultIx.innerInstructions.push(resultIix)
          resultIix.index = length - 1
        }
      }

      return resultIx
    })

    parsedTx.parsed.message.instructions = parsedIxs
  }

  protected getProgramParser(
    programId: string,
  ): Parser<RawInstruction | AlephParsedInstruction, AlephParsedInstruction> {
    return (this.parsers.PROGRAMS as Parsers)[programId] as Parser<
      RawInstruction | AlephParsedInstruction,
      AlephParsedInstruction
    >
  }
}
