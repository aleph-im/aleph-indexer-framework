import { InstructionContextV1, Utils } from '@aleph-indexer/core'
import {
  SPLTokenRawEvent,
  SPLTokenEvent,
  SPLTokenEventInitializeAccount,
  SPLTokenEventInitializeMint,
  SPLTokenEventType,
} from '../types.js'

const { getTokenBalance } = Utils

export class MintParser {
  parse(
    ixCtx: InstructionContextV1,
    mintAddress: string,
  ): SPLTokenEvent | undefined {
    const { ix, parentIx, txContext } = ixCtx
    const parentTx = txContext.tx
    const parsed = (ix as SPLTokenRawEvent).parsed

    // @note: Skip unrelated token ixs from being parsed
    if (
      parsed.info &&
      'mint' in parsed.info &&
      parsed.info.mint !== mintAddress
    )
      return

    const id = `${parentTx.signature}${
      parentIx ? `:${parentIx.index.toString().padStart(2, '0')}` : ''
    }:${ix.index.toString().padStart(2, '0')}`

    const timestamp = parentTx.blockTime
      ? parentTx.blockTime * 1000
      : parentTx.slot
    const type = parsed.type

    switch (type) {
      case SPLTokenEventType.InitializeAccount:
      case SPLTokenEventType.InitializeAccount2:
      case SPLTokenEventType.InitializeAccount3: {
        const { account, owner, mint } = parsed.info
        const balance = getTokenBalance(parentTx, account) as string

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
