/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import { List, listBeet } from './List.js'
export type StakeSystem = {
  stakeList: List
  delayedUnstakeCoolingDown: beet.bignum
  stakeDepositBumpSeed: number
  stakeWithdrawBumpSeed: number
  slotsForStakeDelta: beet.bignum
  lastStakeDeltaEpoch: beet.bignum
  minStake: beet.bignum
  extraStakeDeltaRuns: number
}

/**
 * @category userTypes
 * @category generated
 */
export const stakeSystemBeet = new beet.BeetArgsStruct<StakeSystem>(
  [
    ['stakeList', listBeet],
    ['delayedUnstakeCoolingDown', beet.u64],
    ['stakeDepositBumpSeed', beet.u8],
    ['stakeWithdrawBumpSeed', beet.u8],
    ['slotsForStakeDelta', beet.u64],
    ['lastStakeDeltaEpoch', beet.u64],
    ['minStake', beet.u64],
    ['extraStakeDeltaRuns', beet.u32],
  ],
  'StakeSystem',
)