import { jest } from '@jest/globals'
import BN from 'bn.js'
jest.useFakeTimers()

import { bnMulPrice } from '../number.js'

describe('bnMulPrice', () => {
  it('should work as expected', async () => {
    const res = bnMulPrice(new BN('1380000'), 1 / 1.38, 6, 0)
    expect(res.toNumber()).toBe(1)
  })
})
