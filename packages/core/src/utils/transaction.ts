import { PublicKey } from '@solana/web3.js'
import {
  SolanaParsedInstructionV1,
  SolanaParsedTransactionV1,
} from '../types/index.js'
import { isParsedIx } from './instruction.js'

export function txIxsCheck(
  tx: SolanaParsedTransactionV1,
  check: (ix: SolanaParsedInstructionV1) => boolean,
): boolean {
  const ixs = tx.parsed.message.instructions
  if (ixs.some(check)) return true

  for (const ix of ixs) {
    const iixs = (ix.innerInstructions || []) as SolanaParsedInstructionV1[]
    if (iixs.some(check)) return true
  }
  return false
}

export function txHasProgramId(
  tx: SolanaParsedTransactionV1,
  programId: PublicKey | string,
): boolean {
  return txIxsCheck(
    tx,
    (ix: SolanaParsedInstructionV1) => ix.programId === programId.toString(),
  )
}

export function txHasType(
  tx: SolanaParsedTransactionV1,
  type: string,
): boolean {
  return txIxsCheck(
    tx,
    (ix: SolanaParsedInstructionV1) =>
      isParsedIx(ix) && ix.parsed.type === type,
  )
}

export function getTokenBalance(
  tx: SolanaParsedTransactionV1,
  address: string,
  post = true,
): string | undefined {
  const balanceIndex = tx.parsed.message.accountKeys.findIndex(
    ({ pubkey }) => pubkey === address,
  )

  const key = post ? 'postTokenBalances' : 'preTokenBalances'

  let balanceInfo = tx.meta?.[key]?.find(
    ({ accountIndex }) => accountIndex === balanceIndex,
  )

  /**
   * @note:
   * Corner cases
   *
   * 1. After some events like "closeAccount" the balance may not change
   * and not be present on "postTokenBalances", so pick it from "preTokenBalances"
   *
   * 2. For token "So11111111111111111111111111111111111111112" (Wrapped SOL) in which if we close the account on the same tx,
   * the postTokenBalance will be 0 and the postBalance will be the holded amount on that account. Set it as 0 atm
   * https://solscan.io/tx/5D6nddfkvRzFe9VHAmZ73YXeqsNQDRjw1qp9bfzhoEQUA6X4Yxy3SXL7rXw1UVsAhRPHnBkaBcMTGiPJouBBK1ZY
   *
   * @todo: calculate tx inner balances (taking preBalances and aggregating each tx)
   */

  // 1.
  if (!balanceInfo && post) {
    balanceInfo = tx.meta?.preTokenBalances?.find(
      ({ accountIndex }) => accountIndex === balanceIndex,
    )
  }

  // 2.
  if (!balanceInfo && post) {
    return '0'
  }

  return balanceInfo?.uiTokenAmount.amount
}

export function getBalance(
  tx: SolanaParsedTransactionV1,
  address: string,
  post = true,
): string | undefined {
  const balanceIndex = tx.parsed.message.accountKeys.findIndex(
    ({ pubkey }) => pubkey === address,
  )

  const key = post ? 'postBalances' : 'preBalances'
  const amount = tx.meta?.[key]?.[balanceIndex]
  return amount ? String(amount) : undefined
}

// @todo: Refactor and remove this
export const tx_has_type = txHasType
export const tx_has_programId = txHasProgramId
