import BN from 'bn.js'
import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction,
  RawInstruction,
} from '../types.js'
import { TOKEN_PROGRAM_ID } from '../constants.js'
import {
  SolanaInstructionContext,
  SolanaInstructionContextV1,
} from '../fetcher/index.js'

export function isTokenInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): boolean {
  return ix.programId === TOKEN_PROGRAM_ID
}

/**
 * Guard to validate if it is a valid instruction
 */
export function isParsedIx(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
  return 'parsed' in ix
}

export function isTokenParsedInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
  if (!isParsedIx(ix) || !isTokenInstruction(ix)) return false
  return true
}

export function getTransferedAmount(
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

export function getSubInstructions(
  ixCtx: SolanaInstructionContext | SolanaInstructionContextV1,
): (AlephParsedInstruction | AlephParsedInnerInstruction)[] {
  const { ix, parentIx } = ixCtx

  return parentIx
    ? // Sibling ixs
      (parentIx.innerInstructions || []).slice(ix.index + 1)
    : // ix inner ixs
      (ix as AlephParsedInstruction).innerInstructions || []
}
