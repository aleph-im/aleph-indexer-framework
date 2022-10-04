import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction,
  RawInstruction,
} from '../types.js'
import { TOKEN_PROGRAM_ID } from '../constants.js'
import BN from 'bn.js'
import { InstructionContext, InstructionContextV1 } from '../indexer/index.js'

/**
 * Returns true if the instruction is from the SPL Token program.
 * @param ix Instruction to check.
 */
export function isTokenInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): boolean {
  return ix.programId === TOKEN_PROGRAM_ID
}

/**
 * Returns true if the instruction is already parsed.
 * @param ix Instruction to check.
 */
export function isParsedIx(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
  return 'parsed' in ix
}

/**
 * Returns true if the instruction is a parsed SPL Token instruction.
 * @param ix Instruction to check.
 */
export function isTokenParsedInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
  if (!isParsedIx(ix) || !isTokenInstruction(ix)) return false
  return true
}

/**
 * Returns the raw amount of tokens transferred by the instruction.
 * @param sourceAddress Address of the source account.
 * @param targetAddress Address of the target account.
 * @param subIxs Subinstructions of the instruction.
 */
export function getTransferredAmount(
  sourceAddress: string,
  targetAddress: string,
  subIxs: (AlephParsedInstruction | AlephParsedInnerInstruction)[],
): BN {
  const transferIx = subIxs.find(
    (six: AlephParsedInstruction | AlephParsedInnerInstruction) => {
      if (!isTokenParsedInstruction(six)) return false
      if (six.parsed.type !== 'transfer') return false

      const { source, destination } = six.parsed.info
      return source === sourceAddress && destination === targetAddress
    },
  ) as AlephParsedParsedInstruction

  if (!transferIx) return new BN(0)

  return new BN(transferIx.parsed.info.amount)
}

/**
 * Returns the raw amount of minted collateral tokens.
 * @param userCollateral Address of the user collateral account.
 * @param reserveCollateralMint Address of the reserve collateral mint account.
 * @param subIxs Subinstructions of the instruction.
 */
export function getMintedCollateralAmount(
  userCollateral: string,
  reserveCollateralMint: string,
  subIxs: (AlephParsedInstruction | AlephParsedInnerInstruction)[],
): BN {
  return getCollateralAmount(
    userCollateral,
    reserveCollateralMint,
    subIxs,
    'mintTo',
  )
}

/**
 * Returns the raw amount of burned collateral tokens.
 * @param userCollateral Address of the user collateral account.
 * @param reserveCollateralMint Address of the reserve collateral mint account.
 * @param subIxs Subinstructions of the instruction.
 */
export function getBurnedCollateralAmount(
  userCollateral: string,
  reserveCollateralMint: string,
  subIxs: (AlephParsedInstruction | AlephParsedInnerInstruction)[],
): BN {
  return getCollateralAmount(
    userCollateral,
    reserveCollateralMint,
    subIxs,
    'burn',
  )
}

/**
 * Returns the raw amount of collateral tokens burned or minted by the instruction.
 * @param userCollateral Address of the user collateral account.
 * @param reserveCollateralMint Address of the reserve collateral mint account.
 * @param subIxs Subinstructions of the instruction.
 * @param type Either 'mintTo' or 'burn'.
 */
export function getCollateralAmount(
  userCollateral: string,
  reserveCollateralMint: string,
  subIxs: (AlephParsedInstruction | AlephParsedInnerInstruction)[],
  type: 'mintTo' | 'burn',
): BN {
  const mintIx = subIxs.find(
    (six: AlephParsedInstruction | AlephParsedInnerInstruction) => {
      if (!isTokenParsedInstruction(six)) return false
      if (six.parsed.type !== type) return false

      const { account, mint } = six.parsed.info

      return account === userCollateral && mint === reserveCollateralMint
    },
  ) as AlephParsedParsedInstruction

  if (!mintIx) return new BN(0)

  return new BN(mintIx.parsed.info.amount)
}

/**
 * Returns the subinstructions of the instruction.
 * @param ixCtx Instruction context.
 */
export function getSubInstructions(
  ixCtx: InstructionContext | InstructionContextV1,
): (AlephParsedInstruction | AlephParsedInnerInstruction)[] {
  const { ix, parentIx } = ixCtx

  return parentIx
    ? // Sibling ixs
      (parentIx.innerInstructions || []).slice(ix.index + 1)
    : // ix inner ixs
      (ix as AlephParsedInstruction).innerInstructions || []
}
