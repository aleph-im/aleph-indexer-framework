import { EventBase } from '@aleph-indexer/framework'
import * as solita from './solita/index.js'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

export enum InstructionType {
  CreateApp = 'CreateAppEvent',
  CreateToken = 'CreateTokenEvent',
  EditTokenPrice = 'EditTokenPriceEvent',
  BuyToken = 'BuyTokenEvent',
  ShareToken = 'ShareTokenEvent',
  WithdrawFunds = 'WithdrawFundsEvent',
  Refund = 'RefundEvent',
  UseToken = 'UseTokenEvent',
  Deletetoken = 'DeletetokenEvent',
}

export type InstructionBase = EventBase<InstructionType> & {
  programId: string
  signer: string
  account: string
}

/*-----------------------* CUSTOM EVENTS TYPES *-----------------------*/

export type CreateAppEventData = {
  appName: string
  feeBasisPoints: number
}

export type CreateAppInfo = {
  data: CreateAppEventData
  accounts: solita.CreateAppInstructionAccounts
}

export type CreateAppEvent = InstructionBase &
  CreateAppInfo & {
    type: InstructionType.CreateApp
  }

/*----------------------------------------------------------------------*/

export type CreateTokenEventData = {
  offChainId: string
  offChainId2: string
  offChainMetadata: string
  refundTimespan: BN
  tokenPrice: number
  exemplars: number
  tokenName: string
  tokenSymbol: string
  tokenUri: string
}

export type CreateTokenInfo = {
  data: CreateTokenEventData
  accounts: solita.CreateTokenInstructionAccounts
}

export type CreateTokenEvent = InstructionBase &
  CreateTokenInfo & {
    type: InstructionType.CreateToken
  }

/*----------------------------------------------------------------------*/

export type EditTokenPriceEventData = {
  tokenPrice: number
}

export type EditTokenPriceInfo = {
  data: EditTokenPriceEventData
  accounts: solita.EditTokenPriceInstructionAccounts
}

export type EditTokenPriceEvent = InstructionBase &
  EditTokenPriceInfo & {
    type: InstructionType.EditTokenPrice
  }

/*----------------------------------------------------------------------*/

export type BuyTokenEventData = {
  timestamp: BN
}

export type BuyTokenInfo = {
  data: BuyTokenEventData
  accounts: solita.BuyTokenInstructionAccounts
}

export type BuyTokenEvent = InstructionBase &
  BuyTokenInfo & {
    type: InstructionType.BuyToken
  }

/*----------------------------------------------------------------------*/

export type ShareTokenEventData = {
  exemplars: number
}

export type ShareTokenInfo = {
  data: ShareTokenEventData
  accounts: solita.ShareTokenInstructionAccounts
}

export type ShareTokenEvent = InstructionBase &
  ShareTokenInfo & {
    type: InstructionType.ShareToken
  }

/*----------------------------------------------------------------------*/

export type WithdrawFundsInfo = {
  accounts: solita.WithdrawFundsInstructionAccounts
}

export type WithdrawFundsEvent = InstructionBase &
  WithdrawFundsInfo & {
    type: InstructionType.WithdrawFunds
  }

/*----------------------------------------------------------------------*/

export type RefundInfo = {
  accounts: solita.RefundInstructionAccounts
}

export type RefundEvent = InstructionBase &
  RefundInfo & {
    type: InstructionType.Refund
  }

/*----------------------------------------------------------------------*/

export type UseTokenInfo = {
  accounts: solita.UseTokenInstructionAccounts
}

export type UseTokenEvent = InstructionBase &
  UseTokenInfo & {
    type: InstructionType.UseToken
  }

/*----------------------------------------------------------------------*/

export type DeletetokenInfo = {
  accounts: solita.DeletetokenInstructionAccounts
}

export type DeletetokenEvent = InstructionBase &
  DeletetokenInfo & {
    type: InstructionType.Deletetoken
  }

/*----------------------------------------------------------------------*/

export function getInstructionType(data: Buffer): InstructionType | undefined {
  const discriminator = data.slice(0, 8)
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE: Map<string, InstructionType | undefined> = new Map<
  string,
  InstructionType | undefined
>([
  [
    Buffer.from(solita.createAppInstructionDiscriminator).toString('ascii'),
    InstructionType.CreateApp,
  ],
  [
    Buffer.from(solita.createTokenInstructionDiscriminator).toString('ascii'),
    InstructionType.CreateToken,
  ],
  [
    Buffer.from(solita.editTokenPriceInstructionDiscriminator).toString(
      'ascii',
    ),
    InstructionType.EditTokenPrice,
  ],
  [
    Buffer.from(solita.buyTokenInstructionDiscriminator).toString('ascii'),
    InstructionType.BuyToken,
  ],
  [
    Buffer.from(solita.shareTokenInstructionDiscriminator).toString('ascii'),
    InstructionType.ShareToken,
  ],
  [
    Buffer.from(solita.withdrawFundsInstructionDiscriminator).toString('ascii'),
    InstructionType.WithdrawFunds,
  ],
  [
    Buffer.from(solita.refundInstructionDiscriminator).toString('ascii'),
    InstructionType.Refund,
  ],
  [
    Buffer.from(solita.useTokenInstructionDiscriminator).toString('ascii'),
    InstructionType.UseToken,
  ],
  [
    Buffer.from(solita.deletetokenInstructionDiscriminator).toString('ascii'),
    InstructionType.Deletetoken,
  ],
])
export const IX_DATA_LAYOUT: Partial<Record<InstructionType, any>> = {
  [InstructionType.CreateApp]: solita.createAppStruct,
  [InstructionType.CreateToken]: solita.createTokenStruct,
  [InstructionType.EditTokenPrice]: solita.editTokenPriceStruct,
  [InstructionType.BuyToken]: solita.buyTokenStruct,
  [InstructionType.ShareToken]: solita.shareTokenStruct,
  [InstructionType.WithdrawFunds]: solita.withdrawFundsStruct,
  [InstructionType.Refund]: solita.refundStruct,
  [InstructionType.UseToken]: solita.useTokenStruct,
  [InstructionType.Deletetoken]: solita.deletetokenStruct,
}

export const IX_ACCOUNTS_LAYOUT: Partial<Record<InstructionType, any>> = {
  [InstructionType.CreateApp]: solita.CreateAppAccounts,
  [InstructionType.CreateToken]: solita.CreateTokenAccounts,
  [InstructionType.EditTokenPrice]: solita.EditTokenPriceAccounts,
  [InstructionType.BuyToken]: solita.BuyTokenAccounts,
  [InstructionType.ShareToken]: solita.ShareTokenAccounts,
  [InstructionType.WithdrawFunds]: solita.WithdrawFundsAccounts,
  [InstructionType.Refund]: solita.RefundAccounts,
  [InstructionType.UseToken]: solita.UseTokenAccounts,
  [InstructionType.Deletetoken]: solita.DeletetokenAccounts,
}

export type ParsedEventsInfo =
  | CreateAppInfo
  | CreateTokenInfo
  | EditTokenPriceInfo
  | BuyTokenInfo
  | ShareTokenInfo
  | WithdrawFundsInfo
  | RefundInfo
  | UseTokenInfo
  | DeletetokenInfo

export type ParsedEvents =
  | CreateAppEvent
  | CreateTokenEvent
  | EditTokenPriceEvent
  | BuyTokenEvent
  | ShareTokenEvent
  | WithdrawFundsEvent
  | RefundEvent
  | UseTokenEvent
  | DeletetokenEvent
