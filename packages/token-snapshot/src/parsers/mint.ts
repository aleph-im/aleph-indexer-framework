import { SolanaParsedInstructionContext, getTokenBalance } from '@aleph-indexer/solana'
import {
  SPLTokenRawEvent,
  SPLTokenEvent,
  SPLTokenEventInitializeAccount,
  SPLTokenEventInitializeMint,
  SPLTokenEventType,
} from '../types.js'

export class MintParser {
  parse(
    ixCtx: SolanaParsedInstructionContext,
    mintAddress: string,
  ): SPLTokenEvent | undefined {
    const { instruction, parentInstruction, parentTransaction } = ixCtx
    const parsed = (instruction as SPLTokenRawEvent).parsed

    // @note: Skip unrelated token ixs from being parsed
    if (
      parsed.info &&
      'mint' in parsed.info &&
      parsed.info.mint !== mintAddress
    )
      return

    const id = `${parentTransaction.signature}${
      parentInstruction ? `:${parentInstruction.index.toString().padStart(2, '0')}` : ''
    }:${instruction.index.toString().padStart(2, '0')}`

    const timestamp = parentTransaction.blockTime
      ? parentTransaction.blockTime * 1000
      : parentTransaction.slot
    const type = parsed.type

    switch (type) {
      case SPLTokenEventType.InitializeAccount:
      case SPLTokenEventType.InitializeAccount2:
      case SPLTokenEventType.InitializeAccount3: {
        const { account, owner, mint } = parsed.info
        const balance = getTokenBalance(parentTransaction, account) as string

        const res: SPLTokenEventInitializeAccount = {
          id,
          timestamp,
          type: SPLTokenEventType.InitializeAccount,
          balance,
          account,
          owner,
          mint,
        }

        console.log('---> init account => ', account, id)

        return res
      }

      case SPLTokenEventType.InitializeMint:
      case SPLTokenEventType.InitializeMint2: {
        const { mint, mintAuthority } = parsed.info

        const res: SPLTokenEventInitializeMint = {
          id,
          timestamp,
          type: SPLTokenEventType.InitializeMint,
          balance: '0',
          account: mintAuthority,
          owner: mintAuthority,
          mint,
        }

        console.log('---> init MINT => ', id)

        return res
      }
    }
  }
}

export const mintParser = new MintParser()
export default mintParser
