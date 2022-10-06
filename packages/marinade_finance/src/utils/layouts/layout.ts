import { MARINADE_FINANCE_PROGRAM_ID } from '../../constants.js'
import { ACCOUNTS_DATA_LAYOUT } from './accounts.js'
import {
  InstructionType,
  IX_DATA_LAYOUT,
  getInstructionType,
  IX_ACCOUNTS_LAYOUT,
} from './instructions.js'

export default {
  [MARINADE_FINANCE_PROGRAM_ID]: {
    name: 'marinade_finance',
    programID: MARINADE_FINANCE_PROGRAM_ID,
    accountLayoutMap: IX_ACCOUNTS_LAYOUT,
    dataLayoutMap: new Proxy(IX_DATA_LAYOUT, {
        get(target: Partial<Record<InstructionType, any>>, p: string | symbol): any {
          const schema = target[p as InstructionType]
          return new Proxy(schema, {get: (target2, p2) => {
            switch (p2) {
              case 'decode':
                return target2.deserialize.bind(target2)
              case 'encode':
                return target2.serialize.bind(target2)
            }
            return target2[p2]
            }
          })
        }
      }),
    accountDataLayoutMap: ACCOUNTS_DATA_LAYOUT,
    eventType: InstructionType,
    getInstructionType,
  },
}
