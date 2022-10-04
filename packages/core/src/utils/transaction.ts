import { PublicKey } from '@solana/web3.js'
import {
  AlephParsedInstruction,
  AlephParsedTransaction,
  ParsedTransactionV1,
} from '../types.js'
import { isParsedIx } from './instruction.js'

/**
 * Returns true if at least one instruction in the transaction fulfills the check function.
 * @param tx Transaction to check.
 * @param check Function to check the instructions with.
 */
export function txIxsCheck(
  tx: AlephParsedTransaction | ParsedTransactionV1,
  check: (ix: AlephParsedInstruction) => boolean,
): boolean {
  const ixs = tx.parsed.message.instructions
  if (ixs.some(check)) return true

  for (const ix of ixs) {
    const iixs = (ix.innerInstructions || []) as AlephParsedInstruction[]
    if (iixs.some(check)) return true
  }
  return false
}

/**
 * Returns true if the transaction contains an instruction originating from a given program ID.
 * @param tx Transaction to check.
 * @param programId Program ID to check for.
 */
export function txHasProgramId(
  tx: AlephParsedTransaction | ParsedTransactionV1,
  programId: PublicKey | string,
): boolean {
  return txIxsCheck(
    tx,
    (ix: AlephParsedInstruction) => ix.programId === programId.toString(),
  )
}

/**
 * Returns true if the transaction contains an instruction for a given parsed instruction type.
 * @param tx Transaction to check.
 * @param type Instruction type to check for.
 */
export function txHasType(
  tx: AlephParsedTransaction | ParsedTransactionV1,
  type: string,
): boolean {
  return txIxsCheck(
    tx,
    (ix: AlephParsedInstruction) => isParsedIx(ix) && ix.parsed.type === type,
  )
}

/**
 * Returns the raw SPL token balance of an account in a transaction.
 * @param tx Transaction to check.
 * @param address Address of the SPL token account.
 * @param post True if the balance should be the balance after the transaction, false if it should be the balance before the transaction.
 *
 * @note:
 * Corner cases, which this function handles:
 *
 * 1. After some events like "closeAccount" the balance may not change
 * and not be present on "postTokenBalances", so pick it from "preTokenBalances".
 *
 * 2. For token "So11111111111111111111111111111111111111112" (Wrapped SOL) if we close the account on the same tx,
 * the postTokenBalance will be 0 and the postBalance will be the held amount on that account. Set it as 0 at the moment.
 * An example: https://solscan.io/tx/5D6nddfkvRzFe9VHAmZ73YXeqsNQDRjw1qp9bfzhoEQUA6X4Yxy3SXL7rXw1UVsAhRPHnBkaBcMTGiPJouBBK1ZY
 *
 * @todo: calculate tx inner balances (taking preBalances and aggregating each tx)
 *
 */
export function getTokenBalance(
  tx: AlephParsedTransaction | ParsedTransactionV1,
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

/**
 * Returns the raw SOL balance of an account in a transaction.
 * @param tx Transaction to check.
 * @param address Address of the account.
 * @param post True if the balance should be the balance after the transaction, false if it should be the balance before the transaction.
 */
export function getBalance(
  tx: AlephParsedTransaction | ParsedTransactionV1,
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
