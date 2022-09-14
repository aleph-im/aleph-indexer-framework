import {
  AlephParsedErrorIx,
  ParsedInstructionV1,
  ParsedTransactionV1,
  RawInstruction,
  RawTransactionV1,
  ProgramErrorType,
  TransactionErrorType,
  AlephParsedInnerTransaction,
} from '@aleph-indexer/core'
import { StrictParser } from './parser.js'
import { InstructionParserLibrary } from './instructionParserLibrary.js'

/**
 * Core class which parses raw transactions into parsed transactions with parsed
 * instructions.
 */
export class TransactionParser extends StrictParser<
  RawTransactionV1,
  ParsedTransactionV1
> {
  /**
   * @param instructionParserAggregator Aggregates all available instruction parsers for use.
   */
  constructor(
    protected instructionParserAggregator: InstructionParserLibrary,
  ) {
    super()
  }

  /**
   * Parses a raw transaction into a parsed transaction.
   * @param rawTx The raw or partly-parsed transaction to parse.
   */
  async parse(
    rawTx: RawTransactionV1 | ParsedTransactionV1,
  ): Promise<ParsedTransactionV1> {
    if ('parsed' in rawTx) return rawTx as ParsedTransactionV1
    if (!('transaction' in rawTx))
      throw new Error(`‼️ Empty rawTx ${JSON.stringify(rawTx, null, 2)}`)

    const parsedTx = rawTx as unknown as ParsedTransactionV1
    parsedTx.parsed =
      rawTx.transaction as unknown as AlephParsedInnerTransaction

    parsedTx.signature = parsedTx.parsed.signatures[0]

    this.parseError(parsedTx)

    if (parsedTx.parsed.message.instructions.length > 0) {
      await this.parseInstructions(parsedTx)
    }

    delete (parsedTx as any).transaction

    return parsedTx
  }

  // @note: Take a look at:
  // https://github.com/solana-labs/solana/blob/master/sdk/src/transaction/error.rs#L13
  // https://github.com/solana-labs/solana/blob/master/sdk/program/src/program_error.rs#L12
  /**
   * Parses the errors of a parsed transaction, if any.
   * @param parsedTx The parsed transaction to parse the errors of.
   * @protected
   */
  protected parseError(parsedTx: ParsedTransactionV1): void {
    const err = parsedTx.meta?.err as Record<
      string,
      [number, Record<string, number>]
    >

    if (!err) return

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

  /**
   * Parses the instructions of a parsed transaction.
   * @param parsedTx The parsed transaction to parse the instructions of.
   * @protected
   */
  protected async parseInstructions(parsedTx: ParsedTransactionV1): Promise<void> {
    const instructions = parsedTx.parsed.message.instructions
    const innerInstructions = parsedTx.meta?.innerInstructions || []
    const innerInstructionsMap = innerInstructions.reduce((acc, curr) => {
      acc[curr.index] = curr.instructions
      return acc
    }, {} as Record<number, RawInstruction[]>)

    const parsedIxs = await Promise.all(
      instructions.map(async (rawIx, index) => {
        const resultIx = (await this.instructionParserAggregator.parse(
          rawIx,
        )) as ParsedInstructionV1
        resultIx.index = index

        const innerIxs = innerInstructionsMap[index] || []

        if (innerIxs.length > 0) {
          resultIx.innerInstructions = []

          for (const rawIix of innerIxs) {
            const resultIix = (await this.instructionParserAggregator.parse(
              rawIix,
            )) as ParsedInstructionV1
            resultIix.index = resultIx.innerInstructions.push(resultIix) - 1
          }
        }

        return resultIx
      }),
    )

    parsedTx.parsed.message.instructions = parsedIxs
  }
}
