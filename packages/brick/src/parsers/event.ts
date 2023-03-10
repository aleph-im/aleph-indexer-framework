import {
  SolanaParsedInstructionContext,
  SolanaParsedEvent,
} from '@aleph-indexer/solana'
import { AccountDomain } from '../domain/account.js'
import {
  ParsedEvents,
  ParsedEventsInfo,
  InstructionType,
  UseTokenEvent,
  UseTokenInfo,
  UseTokenInstructionAccounts,
  CreateAppInfo,
  CreateAppEvent,
  CreateAppInstructionAccounts,
  TokenMetadataWithId2,
} from '../utils/layouts/index.js'
import { Publish, Get } from "aleph-sdk-ts/dist/messages/post/index.js"
import { ItemType } from "aleph-sdk-ts/dist/messages/message.js"
import { SOLAccount } from 'aleph-sdk-ts/dist/accounts/solana.js'
import { AlephDataSetContent } from '../types.js';

export class EventParser {  
  async parse(ixCtx: SolanaParsedInstructionContext, accounts: Record<string, AccountDomain>, account: SOLAccount): Promise<ParsedEvents> {
    const { instruction, parentTransaction, parentInstruction } = ixCtx
    const parsed = (instruction as SolanaParsedEvent<InstructionType, ParsedEventsInfo>)
      .parsed

    const id = `${parentTransaction.signature}${
      parentInstruction ? ` :${parentInstruction.index.toString().padStart(2, '0')}` : ''
    }:${instruction.index.toString().padStart(2, '0')}`

    const timestamp = parentTransaction.blockTime
      ? parentTransaction.blockTime * 1000
      : parentTransaction.slot

    const authority = parsed.info.accounts.authority.toString()
    if (parsed.type === InstructionType.CreateApp) {
      return {
        id,
        timestamp,
        type: parsed.type,
        account: (parsed.info.accounts as CreateAppInstructionAccounts).app.toString(),
        signer: authority,
        ...parsed.info as CreateAppInfo,
      } as CreateAppEvent
    } else {
      const tokenAccount = (parsed.info.accounts as UseTokenInstructionAccounts).token.toString()
      console.log('authority', authority, tokenAccount)
      if (parsed.type === InstructionType.UseToken) {
        const seller = (accounts[tokenAccount].info.data as TokenMetadataWithId2).authority.toString()
        const appAddress = (accounts[tokenAccount].info.data as TokenMetadataWithId2).app.toString()
        if (appAddress === '3zDf4PEpshwWuv5EL9NVwZ6wE5tKSqT6Erbr46zpeVuz') {
          const hash1 = (accounts[tokenAccount].info.data as TokenMetadataWithId2).offChainId.toString()
          const hash2 = (accounts[tokenAccount].info.data as TokenMetadataWithId2).offChainId2.toString()
          const dataSet = await Get<AlephDataSetContent>({
            types: 'Dataset',
            pagination: 1,
            page: 1,
            hashes: [hash1 + hash2],
            APIServer: "https://api2.aleph.im",
          })
          const timeseriesIds = dataSet.posts[0].content.timeseriesIDs
          for (const id of timeseriesIds) {
            await Publish({
              account: account,
              postType: 'Permission',
              content: {
                timeseriesID: id,
                autorizer: seller, // solana account that lists the token
                status: "GRANTED",
                executionCount: 0,
                maxExecutionCount: -1,
                requestor: authority, // solana address that burns the token
              },
              channel: 'FISHNET_TEST_V1', // need the gud channel
              APIServer: 'https://api2.aleph.im',
              inlineRequested: true,
              storageEngine: ItemType.inline
            })
          }
        }
        return {
          id,
          timestamp,
          type: parsed.type,
          account: tokenAccount,
          signer: authority,
          ...parsed.info as UseTokenInfo,
        } as UseTokenEvent
      } else {
        return {
          id,
          timestamp,
          type: parsed.type,
          account: tokenAccount,
          signer: authority,
          ...parsed.info as ParsedEventsInfo,
        } as ParsedEvents
      }
    }
  }
}

export const eventParser = new EventParser()
export default eventParser
