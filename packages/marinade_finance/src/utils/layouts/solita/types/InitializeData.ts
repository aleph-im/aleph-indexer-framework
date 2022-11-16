/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { Fee, feeBeet } from './Fee.js'
import {
  LiqPoolInitializeData,
  liqPoolInitializeDataBeet,
} from './LiqPoolInitializeData.js'
export type InitializeData = {
  adminAuthority: web3.PublicKey
  validatorManagerAuthority: web3.PublicKey
  minStake: beet.bignum
  rewardFee: Fee
  liqPool: LiqPoolInitializeData
  additionalStakeRecordSpace: number
  additionalValidatorRecordSpace: number
  slotsForStakeDelta: beet.bignum
}

/**
 * @category userTypes
 * @category generated
 */
export const initializeDataBeet = new beet.BeetArgsStruct<InitializeData>(
  [
    ['adminAuthority', beetSolana.publicKey],
    ['validatorManagerAuthority', beetSolana.publicKey],
    ['minStake', beet.u64],
    ['rewardFee', feeBeet],
    ['liqPool', liqPoolInitializeDataBeet],
    ['additionalStakeRecordSpace', beet.u32],
    ['additionalValidatorRecordSpace', beet.u32],
    ['slotsForStakeDelta', beet.u64],
  ],
  'InitializeData',
)