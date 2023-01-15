import { SplInstructionParser } from '@aleph-indexer/framework/dist/src/services/parser/src/splInstructionParser'
import updPriceTxn from '../__mocks__/updPrice.json'
import { PythEventType } from '../../types'
import layout from '../../layouts/layout.js'
import { PYTH_PROGRAM_ID } from '../../constants.js'
import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction,
  RawInstruction,
} from '@aleph-indexer/core/dist'

function isParsedIx(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
  return 'parsed' in ix
}

// prepare the anchor instruction parser
const parser = new SplInstructionParser<PythEventType>(
  PYTH_PROGRAM_ID,
  layout[PYTH_PROGRAM_ID].name,
  layout[PYTH_PROGRAM_ID].getInstructionType,
  layout[PYTH_PROGRAM_ID].accountLayoutMap,
  layout[PYTH_PROGRAM_ID].dataLayoutMap,
)

describe('Pyth: AnchorInstructionParser', () => {
  it('should parse the instruction', () => {
    const parsedIx = parser.parse(updPriceTxn) as AlephParsedInstruction
    expect(parsedIx).toBeDefined()
    if (isParsedIx(parsedIx)) expect(parsedIx.parsed).toBeDefined()
    console.log(parsedIx)
    expect(parsedIx.programId).toEqual(PYTH_PROGRAM_ID)
  })
})
