import { PYTH_PROGRAM_ID } from '../constants.js'
import {
  IX_DATA_LAYOUT,
  getPythEventType,
  IX_ACCOUNTS_LAYOUT,
} from './instructions.js'
import {PythEventType} from "../types.js";

export default {
  [PYTH_PROGRAM_ID]: {
    name: 'pyth_oracle',
    programID: PYTH_PROGRAM_ID,
    accountLayoutMap: IX_ACCOUNTS_LAYOUT,
    dataLayoutMap: IX_DATA_LAYOUT,
    accountDataLayoutMap: undefined,
    eventType: PythEventType,
    getInstructionType: getPythEventType,
  },
}
