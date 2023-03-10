import { InstructionParserLibrary } from '@aleph-indexer/framework/dist/src/services/parser/src/instructionParserLibrary.js'
import path from 'path'
import { TransactionParser } from '@aleph-indexer/framework/dist/src/services/parser/src/transactionParser.js'
import txn from '../__mocks__/txn.json'
import txn_legacy from '../__mocks__/txn_legacy.json'
import txn_v0 from '../__mocks__/txn_v0.json'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const layoutPath = path.join(__dirname, '../layout.js')
let instructionParserLibrary: InstructionParserLibrary
let transactionParser: TransactionParser

beforeAll(() => {
  instructionParserLibrary = new InstructionParserLibrary(layoutPath)
  transactionParser = new TransactionParser(instructionParserLibrary)
})

describe('TransactionParser', () => {
  it('parses a simple transaction', async () => {
    const parsedTxn = await transactionParser.parse(txn as unknown as any)
    expect(parsedTxn).toMatchSnapshot()
  })

  it('parses a legacy transaction', async () => {
    const parsedTxn = await transactionParser.parse(
      txn_legacy as unknown as any,
    )
    expect(parsedTxn).toMatchSnapshot()
  })

  it('parses a v0 transaction', async () => {
    const parsedTxn = await transactionParser.parse(txn_v0 as unknown as any)
    expect(parsedTxn).toMatchSnapshot()
  })
})
