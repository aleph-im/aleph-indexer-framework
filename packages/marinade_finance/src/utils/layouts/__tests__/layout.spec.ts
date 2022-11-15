import {InstructionParserLibrary} from "@aleph-indexer/framework/dist/src/services/parser/src/instructionParserLibrary.js";
import path from "path";
import {TransactionParser} from "@aleph-indexer/framework/dist/src/services/parser/src/transactionParser.js";
import txn from "../__mocks__/txn.json";
import {fileURLToPath} from "url";
import {AlephParsedParsedInstruction} from "@aleph-indexer/core";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('TransactionParser', () => {
  it('parses a transaction', async () => {
    const layoutPath = path.join(__dirname, '../layout.js')
    const instructionParserLibrary = new InstructionParserLibrary(layoutPath)
    const transactionParser = new TransactionParser(instructionParserLibrary)
    // @todo: not type safe
    const parsedTxn = await transactionParser.parse(txn as unknown as any)
    console.log(JSON.stringify(parsedTxn, null, 2))
    expect(parsedTxn).toMatchSnapshot()
    const parsedIxn = (parsedTxn.parsed.message.instructions[1] as AlephParsedParsedInstruction).parsed
    expect(parsedIxn.type).toEqual('OrderUnstake')
    console.log(parsedIxn)
  })
})