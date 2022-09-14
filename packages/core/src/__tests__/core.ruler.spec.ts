import { jest } from '@jest/globals'
jest.useFakeTimers()

import { Ruler } from '../ruler.js'

const rules = {
  cond1: new Ruler<any>('cond1').addRules({
    and: [
      // cond1
      (cond) => {
        return cond
      },
    ],
  }),
  cond1Notcond2A: new Ruler<any>('cond1_not_cond2_A').addRules({
    and: [
      (conds) => {
        return conds.cond1
      },
      (conds) => {
        return conds.cond2 == false
      },
    ],
  }),
  cond1Notcond2B: new Ruler<any>('cond1_not_cond2_B').addRules({
    and: [
      (conds) => {
        return conds.cond1
      },
    ],
    not: [
      (conds) => {
        return conds.cond2 === true
      },
    ],
  }),
  cond1Notcond2C: new Ruler<any>('cond1_not_cond2_C').addRules({
    and: [
      (conds) => {
        return conds.cond1
      },
    ],
    not: [
      // this is the scenario that was fixed
      // if one of the conditions was not satified is must return false
      (conds) => {
        return conds.cond2 === true
      },
      (conds) => {
        return conds.cond2 === false
      },
    ],
  }),
  cond1RejectedButIgnored: new Ruler<any>(
    'cond1_rejected_cond3_ignore_rejection',
  ).addRules({
    and: [
      (conds) => {
        return conds.cond1
      },
    ],
    or: [
      (conds) => {
        return conds.cond3
      },
    ],
  }),
}

describe('Core ruler cond1', () => {
  it('check rule cond1 is true', async () => {
    expect(await rules.cond1.isTrue(true)).toBe(true)
  })

  it('check rule cond1 is false', async () => {
    expect(await rules.cond1.isFalse(false)).toBe(true)
  })
})

describe('Core ruler cond1 not cond2', () => {
  it('check rule cond1 is true and cond2 is false (A)', async () => {
    expect(
      await rules.cond1Notcond2A.isTrue({ cond1: true, cond2: false }),
    ).toBe(true)
  })

  it('check rule cond1 is true and cond2 is false (B)', async () => {
    expect(
      await rules.cond1Notcond2B.isTrue({ cond1: true, cond2: false }),
    ).toBe(true)
  })

  it('check rule cond1 is true and cond2 is true (C)', async () => {
    expect(
      await rules.cond1Notcond2B.isTrue({ cond1: true, cond2: true }),
    ).toBe(false)
  })
})

describe('Core ruler rejected but cond3 bypass', () => {
  it('check rule cond1 rejected cond3 bypass', async () => {
    expect(
      await rules.cond1RejectedButIgnored.isTrue({ cond1: false, cond3: true }),
    ).toBe(true)
  })
})
