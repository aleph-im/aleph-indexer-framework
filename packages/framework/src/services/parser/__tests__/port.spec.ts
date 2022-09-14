import { jest } from '@jest/globals'

jest.useFakeTimers()

import { ParserMsMain } from '../main.js'
import { port1 } from '../__mocks__/txs/port.js'

describe('ParserMs integration', () => {
  let parserMs: ParserMsMain

  beforeEach(() => {
    const mockObj: any = jest.fn()
    parserMs = new ParserMsMain(mockObj, mockObj, mockObj)
  })

  it('port raw transaction should be parsed', async () => {
    const parsedTx = await parserMs.parseTransaction(port1)
    expect(parsedTx).toMatchSnapshot()
  })
})
