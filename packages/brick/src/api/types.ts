import { GraphQLInt } from 'graphql'
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLUnionType,
} from 'graphql'
import { GraphQLBigNumber, GraphQLLong, GraphQLJSON } from '@aleph-indexer/core'
import { InstructionType } from '../utils/layouts/index.js'

// ------------------- TYPES ---------------------------

export const SellerConfig = new GraphQLObjectType({
  name: 'SellerConfig',
  fields: {
    refundTimespan: { type: GraphQLBigNumber },
    price: { type: new GraphQLNonNull(GraphQLInt) },
    acceptedMint: { type: new GraphQLNonNull(GraphQLString) },
    exemplars: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const TransactionsInfo = new GraphQLObjectType({
  name: 'TransactionsInfo',
  fields: {
    sold: { type: new GraphQLNonNull(GraphQLInt) },
    used: { type: new GraphQLNonNull(GraphQLInt) },
    shared: { type: new GraphQLNonNull(GraphQLInt) },
    refunded: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const Bumps = new GraphQLObjectType({
  name: 'Bumps',
  fields: {
    bump: { type: new GraphQLNonNull(GraphQLInt) },
    mintBump: { type: new GraphQLNonNull(GraphQLInt) },
    metadataBump: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

// ------------------- STATS ---------------------------

export const AccessTimeStats = new GraphQLObjectType({
  name: 'AccessTimeStats',
  fields: {
    accesses: { type: new GraphQLNonNull(GraphQLInt) },
    accessesByProgramId: { type: GraphQLJSON },
    startTimestamp: { type: GraphQLLong },
    endTimestamp: { type: GraphQLLong },
  },
})

export const TotalAccounts = new GraphQLObjectType({
  name: 'TotalAccounts',
  fields: {
    App: { type: new GraphQLNonNull(GraphQLInt) },
    Payment: { type: new GraphQLNonNull(GraphQLInt) },
    TokenMetadata: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const GlobalBrickStats = new GraphQLObjectType({
  name: 'GlobalBrickStats',
  fields: {
    totalAccounts: { type: new GraphQLNonNull(TotalAccounts) },
    totalAccesses: { type: new GraphQLNonNull(GraphQLInt) },
    totalAccessesByProgramId: { type: GraphQLJSON },
    startTimestamp: { type: GraphQLLong },
    endTimestamp: { type: GraphQLLong },
  },
})

export const BrickStats = new GraphQLObjectType({
  name: 'BrickStats',
  fields: {
    last1h: { type: AccessTimeStats },
    last24h: { type: AccessTimeStats },
    last7d: { type: AccessTimeStats },
    total: { type: AccessTimeStats },
  },
})

// ------------------- ACCOUNTS ---------------------------

export const AccountsEnum = new GraphQLEnumType({
  name: 'AccountsEnum',
  values: {
    App: { value: 'App' },
    Payment: { value: 'Payment' },
    TokenMetadata: { value: 'TokenMetadata' },
  },
})

export const App = new GraphQLObjectType({
  name: 'App',
  fields: {
    authority: { type: new GraphQLNonNull(GraphQLString) },
    feeBasisPoints: { type: new GraphQLNonNull(GraphQLInt) },
    bump: { type: new GraphQLNonNull(GraphQLInt) },
    appName: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const Payment = new GraphQLObjectType({
  name: 'Payment',
  fields: {
    tokenAccount: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    seller: { type: new GraphQLNonNull(GraphQLString) },
    buyer: { type: new GraphQLNonNull(GraphQLString) },
    price: { type: new GraphQLNonNull(GraphQLInt) },
    paymentTimestamp: { type: GraphQLBigNumber },
    refundConsumedAt: { type: GraphQLBigNumber },
    bump: { type: new GraphQLNonNull(GraphQLInt) },
    bumpVault: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const TokenMetadata = new GraphQLObjectType({
  name: 'TokenMetadata',
  fields: {
    offChainMetadata: { type: new GraphQLNonNull(GraphQLString) },
    app: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    sellerConfig: { type: new GraphQLNonNull(SellerConfig) },
    transactionsInfo: { type: new GraphQLNonNull(TransactionsInfo) },
    bumps: { type: new GraphQLNonNull(Bumps) },
    offChainId2: { type: new GraphQLNonNull(GraphQLString) },
    offChainId: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ParsedAccountsData = new GraphQLUnionType({
  name: 'ParsedAccountsData',
  types: [App, Payment, TokenMetadata],
  resolveType: (obj) => {
    // here is selected a unique property of each account to discriminate between types
    if (obj.appName) {
      return 'App'
    }
    if (obj.bumpVault) {
      return 'Payment'
    }
    if (obj.offChainId) {
      return 'TokenMetadata'
    }
  },
})

const commonAccountInfoFields = {
  name: { type: new GraphQLNonNull(GraphQLString) },
  programId: { type: new GraphQLNonNull(GraphQLString) },
  address: { type: new GraphQLNonNull(GraphQLString) },
  type: { type: new GraphQLNonNull(AccountsEnum) },
}

const Account = new GraphQLInterfaceType({
  name: 'Account',
  fields: {
    ...commonAccountInfoFields,
  },
})

export const BrickAccountsInfo = new GraphQLObjectType({
  name: 'BrickAccountsInfo',
  interfaces: [Account],
  fields: {
    ...commonAccountInfoFields,
    data: { type: new GraphQLNonNull(ParsedAccountsData) },
  },
})

export const AccountsInfo = new GraphQLList(BrickAccountsInfo)

// ------------------- EVENTS --------------------------

export const ParsedEvents = new GraphQLEnumType({
  name: 'ParsedEvents',
  values: {
    CreateAppEvent: { value: 'CreateAppEvent' },
    CreateTokenEvent: { value: 'CreateTokenEvent' },
    EditTokenPriceEvent: { value: 'EditTokenPriceEvent' },
    BuyTokenEvent: { value: 'BuyTokenEvent' },
    ShareTokenEvent: { value: 'ShareTokenEvent' },
    WithdrawFundsEvent: { value: 'WithdrawFundsEvent' },
    RefundEvent: { value: 'RefundEvent' },
    UseTokenEvent: { value: 'UseTokenEvent' },
    DeletetokenEvent: { value: 'DeletetokenEvent' },
  },
})

const commonEventFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
  timestamp: { type: GraphQLLong },
  type: { type: new GraphQLNonNull(ParsedEvents) },
  account: { type: new GraphQLNonNull(GraphQLString) },
  signer: { type: new GraphQLNonNull(GraphQLString) },
}

const Event = new GraphQLInterfaceType({
  name: 'Event',
  fields: {
    ...commonEventFields,
  },
})

/*-----------------------* CUSTOM EVENTS TYPES *-----------------------*/

export const CreateAppEventAccounts = new GraphQLObjectType({
  name: 'CreateAppEventAccounts',
  fields: {
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    app: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const CreateAppEventData = new GraphQLObjectType({
  name: 'CreateAppEventData',
  fields: {
    appName: { type: new GraphQLNonNull(GraphQLString) },
    feeBasisPoints: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const CreateAppEvent = new GraphQLObjectType({
  name: 'CreateAppEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.CreateApp,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(CreateAppEventData) },
    accounts: { type: new GraphQLNonNull(CreateAppEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const CreateTokenEventAccounts = new GraphQLObjectType({
  name: 'CreateTokenEventAccounts',
  fields: {
    metadataProgram: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    app: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
    acceptedMint: { type: new GraphQLNonNull(GraphQLString) },
    tokenMetadata: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const CreateTokenEventData = new GraphQLObjectType({
  name: 'CreateTokenEventData',
  fields: {
    offChainId: { type: new GraphQLNonNull(GraphQLString) },
    offChainId2: { type: new GraphQLNonNull(GraphQLString) },
    offChainMetadata: { type: new GraphQLNonNull(GraphQLString) },
    refundTimespan: { type: GraphQLBigNumber },
    tokenPrice: { type: new GraphQLNonNull(GraphQLInt) },
    exemplars: { type: new GraphQLNonNull(GraphQLInt) },
    tokenName: { type: new GraphQLNonNull(GraphQLString) },
    tokenSymbol: { type: new GraphQLNonNull(GraphQLString) },
    tokenUri: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const CreateTokenEvent = new GraphQLObjectType({
  name: 'CreateTokenEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.CreateToken,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(CreateTokenEventData) },
    accounts: { type: new GraphQLNonNull(CreateTokenEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const EditTokenPriceEventAccounts = new GraphQLObjectType({
  name: 'EditTokenPriceEventAccounts',
  fields: {
    authority: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const EditTokenPriceEventData = new GraphQLObjectType({
  name: 'EditTokenPriceEventData',
  fields: {
    tokenPrice: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const EditTokenPriceEvent = new GraphQLObjectType({
  name: 'EditTokenPriceEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.EditTokenPrice,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(EditTokenPriceEventData) },
    accounts: { type: new GraphQLNonNull(EditTokenPriceEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const BuyTokenEventAccounts = new GraphQLObjectType({
  name: 'BuyTokenEventAccounts',
  fields: {
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    associatedTokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    buyerTransferVault: { type: new GraphQLNonNull(GraphQLString) },
    acceptedMint: { type: new GraphQLNonNull(GraphQLString) },
    payment: { type: new GraphQLNonNull(GraphQLString) },
    paymentVault: { type: new GraphQLNonNull(GraphQLString) },
    buyerTokenVault: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const BuyTokenEventData = new GraphQLObjectType({
  name: 'BuyTokenEventData',
  fields: {
    timestamp: { type: GraphQLBigNumber },
  },
})

export const BuyTokenEvent = new GraphQLObjectType({
  name: 'BuyTokenEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.BuyToken,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(BuyTokenEventData) },
    accounts: { type: new GraphQLNonNull(BuyTokenEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const ShareTokenEventAccounts = new GraphQLObjectType({
  name: 'ShareTokenEventAccounts',
  fields: {
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    associatedTokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    receiverVault: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ShareTokenEventData = new GraphQLObjectType({
  name: 'ShareTokenEventData',
  fields: {
    exemplars: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const ShareTokenEvent = new GraphQLObjectType({
  name: 'ShareTokenEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ShareToken,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(ShareTokenEventData) },
    accounts: { type: new GraphQLNonNull(ShareTokenEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const WithdrawFundsEventAccounts = new GraphQLObjectType({
  name: 'WithdrawFundsEventAccounts',
  fields: {
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    app: { type: new GraphQLNonNull(GraphQLString) },
    appCreatorVault: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    receiverVault: { type: new GraphQLNonNull(GraphQLString) },
    buyer: { type: new GraphQLNonNull(GraphQLString) },
    payment: { type: new GraphQLNonNull(GraphQLString) },
    paymentVault: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const WithdrawFundsEvent = new GraphQLObjectType({
  name: 'WithdrawFundsEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.WithdrawFunds,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(WithdrawFundsEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const RefundEventAccounts = new GraphQLObjectType({
  name: 'RefundEventAccounts',
  fields: {
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    receiverVault: { type: new GraphQLNonNull(GraphQLString) },
    payment: { type: new GraphQLNonNull(GraphQLString) },
    paymentVault: { type: new GraphQLNonNull(GraphQLString) },
    buyerTokenVault: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const RefundEvent = new GraphQLObjectType({
  name: 'RefundEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Refund,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(RefundEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const UseTokenEventAccounts = new GraphQLObjectType({
  name: 'UseTokenEventAccounts',
  fields: {
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    associatedTokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    authority: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
    tokenMint: { type: new GraphQLNonNull(GraphQLString) },
    buyerTokenVault: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const UseTokenEvent = new GraphQLObjectType({
  name: 'UseTokenEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UseToken,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(UseTokenEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const DeletetokenEventAccounts = new GraphQLObjectType({
  name: 'DeletetokenEventAccounts',
  fields: {
    authority: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const DeletetokenEvent = new GraphQLObjectType({
  name: 'DeletetokenEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Deletetoken,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(DeletetokenEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const Events = new GraphQLList(Event)

export const types = [
  CreateAppEvent,
  CreateTokenEvent,
  EditTokenPriceEvent,
  BuyTokenEvent,
  ShareTokenEvent,
  WithdrawFundsEvent,
  RefundEvent,
  UseTokenEvent,
  DeletetokenEvent,
]
