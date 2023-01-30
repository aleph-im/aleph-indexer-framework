import {
  AlephParsedInnerInstruction,
  AlephParsedInstruction,
  AlephParsedParsedInstruction,
  RawInstruction,
} from '@aleph-indexer/core'
import { TOKEN_PROGRAM_ID, LENDING_PROGRAM_IDS } from '../constants.js'
import {
  SPLTokenRawEvent,
  SPLTokenEvent,
  SPLTokenEventType,
  SPLTokenIncompleteEvent,
  LendingRawEvent,
} from '../types.js'

export function isSPLTokenInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is SPLTokenRawEvent {
  return ix.programId === TOKEN_PROGRAM_ID
}

export function isSPLLendingInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is LendingRawEvent {
  return LENDING_PROGRAM_IDS.includes(ix.programId)
}

export function isParsableInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedInstruction {
  return isSPLTokenInstruction(ix) || isSPLLendingInstruction(ix)
}

export function isParsedIx(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is AlephParsedParsedInstruction {
  return 'parsed' in ix
}

export function isSPLTokenParsedInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
): ix is SPLTokenRawEvent {
  if (!isParsedIx(ix) || !isSPLTokenInstruction(ix)) return false
  return true
}

export function isSPLTokenMintInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
  mint: string,
): ix is SPLTokenRawEvent {
  if (!isSPLTokenParsedInstruction(ix)) return false
  return getIxMint(ix) === mint
}

export function isSPLTokenAccountInstruction(
  ix: RawInstruction | AlephParsedInstruction | AlephParsedInnerInstruction,
  account: string,
): ix is SPLTokenRawEvent {
  if (!isSPLTokenParsedInstruction(ix)) return false
  return getIxAccounts(ix).includes(account)
}

export function getIxMint(ix: SPLTokenRawEvent): string | undefined {
  switch (ix.parsed.type) {
    case SPLTokenEventType.MintTo:
    case SPLTokenEventType.MintToChecked:
    case SPLTokenEventType.Burn:
    case SPLTokenEventType.BurnChecked:
    case SPLTokenEventType.InitializeAccount:
    case SPLTokenEventType.InitializeAccount2:
    case SPLTokenEventType.InitializeAccount3:
    case SPLTokenEventType.TransferChecked:
    case SPLTokenEventType.ApproveChecked:
    case SPLTokenEventType.InitializeMint:
    case SPLTokenEventType.InitializeMint2: {
      return ix.parsed.info.mint
    }
  }
}

export function getIxAccounts(ix: SPLTokenRawEvent): string[] {
  switch (ix.parsed.type) {
    case SPLTokenEventType.MintTo:
    case SPLTokenEventType.MintToChecked:
    case SPLTokenEventType.Burn:
    case SPLTokenEventType.BurnChecked:
    case SPLTokenEventType.InitializeAccount:
    case SPLTokenEventType.InitializeAccount2:
    case SPLTokenEventType.InitializeAccount3:
    case SPLTokenEventType.SetAuthority:
    case SPLTokenEventType.SyncNative:
    case SPLTokenEventType.CloseAccount: {
      return [ix.parsed.info.account]
    }
    case SPLTokenEventType.Transfer:
    case SPLTokenEventType.TransferChecked: {
      return [ix.parsed.info.source, ix.parsed.info.destination]
    }
    case SPLTokenEventType.Approve:
    case SPLTokenEventType.ApproveChecked:
    case SPLTokenEventType.Revoke: {
      return [ix.parsed.info.source]
    }
  }

  return []
}

export function getSPLTokenEventAccounts(
  event: SPLTokenIncompleteEvent,
): string[] {
  switch (event.type) {
    case SPLTokenEventType.Transfer: {
      if (event.toAccount) {
        return [event.account, event.toAccount]
      } else {
        return [event.account]
      }
    }
    default: {
      return [event.account]
    }
  }
}

export function getWalletBalanceFromEvent(
  event: SPLTokenIncompleteEvent,
  account: string,
): string {
  switch (event.type) {
    case SPLTokenEventType.Transfer: {
      if (event.toAccount === account) {
        return event.toBalance as string
      } else {
        return event.balance
      }
    }
    default: {
      return event.balance
    }
  }
}

export function getMintAndOwnerFromEvent(
  event: SPLTokenEvent,
  account: string,
): { mint: string; owner?: string } {
  switch (event.type) {
    case SPLTokenEventType.Transfer: {
      if (event.toAccount === account) {
        return { mint: event.mint, owner: event.toOwner }
      } else {
        return { mint: event.mint, owner: event.owner }
      }
    }
    default: {
      return { mint: event.mint, owner: event.owner }
    }
  }
}
