import { BRICK_PROGRAM_ID } from '../../constants.js'
import { ACCOUNTS_DATA_LAYOUT } from './accounts.js'
import {
  InstructionType,
  IX_DATA_LAYOUT,
  getInstructionType,
  IX_ACCOUNTS_LAYOUT,
} from './instructions.js'

export default {
  [BRICK_PROGRAM_ID]: {
    name: 'brick',
    programID: BRICK_PROGRAM_ID,
    accountLayoutMap: IX_ACCOUNTS_LAYOUT,
    dataLayoutMap: IX_DATA_LAYOUT,
    accountDataLayoutMap: ACCOUNTS_DATA_LAYOUT,
    eventType: InstructionType,
    getInstructionType,
  },
}
