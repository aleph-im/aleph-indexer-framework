/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import {
  ConfigMarinadeParams,
  configMarinadeParamsBeet,
} from '../types/ConfigMarinadeParams.js'

/**
 * @category Instructions
 * @category ConfigMarinade
 * @category generated
 */
export type ConfigMarinadeInstructionArgs = {
  params: ConfigMarinadeParams
}
/**
 * @category Instructions
 * @category ConfigMarinade
 * @category generated
 */
export const configMarinadeStruct = new beet.FixableBeetArgsStruct<
  ConfigMarinadeInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['params', configMarinadeParamsBeet],
  ],
  'ConfigMarinadeInstructionArgs',
)
/**
 * Accounts required by the _configMarinade_ instruction
 *
 * @property [_writable_] state
 * @property [**signer**] adminAuthority
 * @category Instructions
 * @category ConfigMarinade
 * @category generated
 */
export type ConfigMarinadeInstructionAccounts = {
  state: web3.PublicKey
  adminAuthority: web3.PublicKey
}

export const ConfigMarinadeAccounts = ['state', 'adminAuthority']

export const configMarinadeInstructionDiscriminator = [
  67, 3, 34, 114, 190, 185, 17, 62,
]

export type ConfigMarinadeInstruction = {
  programId: web3.PublicKey
  keys: web3.AccountMeta[]
  data: Buffer
}

/**
 * Creates a _ConfigMarinade_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category ConfigMarinade
 * @category generated
 */
export function createConfigMarinadeInstruction(
  accounts: ConfigMarinadeInstructionAccounts,
  args: ConfigMarinadeInstructionArgs,
): ConfigMarinadeInstruction {
  const { state, adminAuthority } = accounts

  const [data] = configMarinadeStruct.serialize({
    instructionDiscriminator: configMarinadeInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: state,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: adminAuthority,
      isWritable: false,
      isSigner: true,
    },
  ]

  const ix: ConfigMarinadeInstruction = new web3.TransactionInstruction({
    programId: new web3.PublicKey('NONE'),
    keys,
    data,
  })
  return ix
}
