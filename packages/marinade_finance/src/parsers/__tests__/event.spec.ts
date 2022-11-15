import {jest} from "@jest/globals";

jest.setTimeout(10000)

import { EventParser } from "../event.js";
import { InstructionContextV1 } from "@aleph-indexer/core"


// test correct event parsing
describe('EventParser', () => {
  it('parses Initialize event from InstructionContext', () => {
    const instruction = {
      index: 0,
      parsed: {
        type: "Initialize",
        info: {
          programId: "programId",
        }
      },
      programId: "programId",
      innerInstructions: [],
      data: "data",
      accounts: [],
    }
    const instructionContext: InstructionContextV1 = {
      ix: instruction,
      parentIx: undefined,
      txContext: {
        tx: {
          signature: "signature",
          blocktime: 0,
          slot: 0,
          index: 0,
          meta: {
            err: null,
            fee: 0,
            innerInstructions: [],
            preBalances: [],
            postBalances: [],
          },
          parsed: {
            error: undefined,
            message: {
              instructions: [instruction],
              accountKeys: [],
              recentBlockhash: "recentBlockhash",
            },
            signatures: [],
          }
        },
        parserContext: {
          account: "account",
          startDate: 0,
          endDate: 0,
        }
      }
    }
    const eventParser = new EventParser()
    const parsedEvent = eventParser.parse(instructionContext)
    console.log(parsedEvent)
    expect(parsedEvent).toEqual({
      id: "signature:00",
      timestamp: 0,
      type: "Initialize",
      account: "account",
      programId: "programId",
    })
  })
})