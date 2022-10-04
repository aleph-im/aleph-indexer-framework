import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql'
import {GraphQLLong} from "../scalars.js";

// TokenList definition => https://uniswap.org/tokenlist.schema.json

// --------------------- TOKEN ----------------------------

export const TokenExtensionsType = new GraphQLObjectType({
  name: 'TokenExtensions',
  fields: {
    website: { type: GraphQLString },
    bridgeContract: { type: GraphQLString },
    assetContract: { type: GraphQLString },
    address: { type: GraphQLString },
    explorer: { type: GraphQLString },
    twitter: { type: GraphQLString },
    github: { type: GraphQLString },
    medium: { type: GraphQLString },
    tgann: { type: GraphQLString },
    tggroup: { type: GraphQLString },
    discord: { type: GraphQLString },
    serumV3Usdt: { type: GraphQLString },
    serumV3Usdc: { type: GraphQLString },
    coingeckoId: { type: GraphQLString },
    imageUrl: { type: GraphQLString },
    description: { type: GraphQLString },
  },
})

export const TokenType = new GraphQLObjectType({
  name: 'Token',
  fields: {
    chainId: { type: GraphQLInt },
    address: { type: GraphQLString },
    name: { type: GraphQLString },
    decimals: { type: GraphQLLong },
    symbol: { type: GraphQLString },
    logoURI: { type: GraphQLString },
    tags: { type: new GraphQLList(GraphQLString) },
    extensions: { type: TokenExtensionsType },
  },
})

// ---------------- ADDRESS ------------------------

export const TokenAmount = new GraphQLObjectType({
  name: 'TokenAmount',
  fields: {
    amount: { type: GraphQLLong },
    decimals: { type: GraphQLInt },
    uiAmount: { type: GraphQLFloat },
    uiAmountString: { type: GraphQLString },
  },
})

export const TokenAccount = new GraphQLObjectType({
  name: 'TokenAccount',
  fields: {
    pubkey: { type: GraphQLString },
    isNative: { type: GraphQLBoolean },
    mint: { type: GraphQLString },
    owner: { type: GraphQLString },
    state: { type: GraphQLString },
    tokenAmount: { type: TokenAmount },
    tokenInfo: { type: TokenType },
  },
})

export const AddressDetail = new GraphQLObjectType({
  name: 'AddressDetail',
  fields: {
    address: { type: GraphQLString },
    tokenAccounts: { type: new GraphQLList(TokenAccount) },
  },
})

// ---------------- TRANSACTION --------------------

export const TokenBalance = new GraphQLObjectType({
  name: 'TokenBalance',
  fields: {
    accountIndex: { type: GraphQLInt },
    mint: { type: GraphQLString },
    uiTokenAmount: { type: TokenAmount },
  },
})

export const InstructionInfo = new GraphQLObjectType({
  name: 'InstructionInfo',
  fields: {
    amount: { type: GraphQLLong },
    authority: { type: GraphQLString },
    destination: { type: GraphQLString },
    source: { type: GraphQLString },
    instruction: { type: GraphQLInt },
    maxCoinAmount: { type: GraphQLLong },
    maxPcAmount: { type: GraphQLLong },
    fixedFromCoin: { type: GraphQLLong },
    amountIn: { type: GraphQLLong },
    minAmountOut: { type: GraphQLLong },
    token: { type: GraphQLString },
    ammId: { type: GraphQLString },
    ammAuthority: { type: GraphQLString },
    ammOpenOrders: { type: GraphQLString },
    ammTargetOrders: { type: GraphQLString },
    poolCoinTokenAccount: { type: GraphQLString },
    poolPcTokenAccount: { type: GraphQLString },
    serumProgramId: { type: GraphQLString },
    serumMarket: { type: GraphQLString },
    serumBids: { type: GraphQLString },
    serumAsks: { type: GraphQLString },
    serumEventQueue: { type: GraphQLString },
    serumCoinVaultAccount: { type: GraphQLString },
    serumPcVaultAccount: { type: GraphQLString },
    serumVaultSigner: { type: GraphQLString },
    userSourceTokenAccount: { type: GraphQLString },
    userDestTokenAccount: { type: GraphQLString },
    userOwner: { type: GraphQLString },
  },
})

export const ParsedInstructionResult = new GraphQLObjectType({
  name: 'ParsedInstructionResult',
  fields: {
    info: { type: InstructionInfo },
    type: { type: GraphQLString },
  },
})

export const InstructionResult = new GraphQLObjectType({
  name: 'InstructionResult',
  fields: {
    program: { type: GraphQLString },
    // Program id called by this instruction
    programId: { type: GraphQLString },
    // Public keys of accounts passed to this instruction
    accounts: { type: new GraphQLList(GraphQLString) },
    data: { type: GraphQLString },
    parsed: { type: ParsedInstructionResult },
  },
})

export const ParsedMessageAccount = new GraphQLObjectType({
  name: 'ParsedMessageAccount',
  fields: {
    // Public key of the account
    pubkey: { type: GraphQLString },
    // Indicates if the account signed the transaction */
    signer: { type: GraphQLBoolean },
    // Indicates if the account is writable for this transaction
    writable: { type: GraphQLBoolean },
  },
})

export const ParsedMessage = new GraphQLObjectType({
  name: 'ParsedMessage',
  fields: {
    // Accounts used in the instructions
    accountKeys: { type: new GraphQLList(ParsedMessageAccount) },
    // The atomically executed instructions for the transaction
    instructions: { type: new GraphQLList(InstructionResult) },
    // Recent blockhash
    recentBlockhash: { type: GraphQLString },
  },
})

export const ParsedTransaction = new GraphQLObjectType({
  name: 'ParsedTransaction',
  fields: {
    // Signatures for the transaction
    signatures: { type: new GraphQLList(GraphQLString) },
    // Message of the transaction
    message: { type: ParsedMessage },
  },
})

export const ParsedInnerInstruction = new GraphQLObjectType({
  name: 'ParsedInnerInstruction',
  fields: {
    index: { type: GraphQLInt },
    instructions: { type: new GraphQLList(InstructionResult) },
  },
})

export const ParsedConfirmedTransactionMeta = new GraphQLObjectType({
  name: 'ParsedConfirmedTransactionMeta',
  fields: {
    // The fee charged for processing the transaction
    fee: { type: GraphQLInt },
    // An array of cross program invoked parsed instructions
    innerInstructions: { type: new GraphQLList(ParsedInnerInstruction) },
    // The balances of the transaction accounts before processing
    preBalances: { type: new GraphQLList(GraphQLLong) },
    // The balances of the transaction accounts after processing
    postBalances: { type: new GraphQLList(GraphQLLong) },
    // An array of program log messages emitted during a transaction
    logMessages: { type: new GraphQLList(GraphQLString) },
    // The token balances of the transaction accounts before processing
    preTokenBalances: { type: new GraphQLList(TokenBalance) },
    // The token balances of the transaction accounts after processing */
    postTokenBalances: { type: new GraphQLList(TokenBalance) },
    // The error result of transaction processing
    err: { type: GraphQLString },
  },
})

export const InstructionError = new GraphQLObjectType({
  name: 'InstructionError',
  fields: {
    code: { type: GraphQLInt },
    info: { type: GraphQLString },
  },
})

export const TransactionError = new GraphQLObjectType({
  name: 'TransactionError',
  fields: {
    InstructionError: { type: InstructionError },
  },
})

export const TransactionItem = new GraphQLObjectType({
  name: 'TransactionItem',
  fields: {
    signature: { type: new GraphQLNonNull(GraphQLString) },
    slot: { type: new GraphQLNonNull(GraphQLInt) },
    err: { type: TransactionError },
    memo: { type: GraphQLString },
    blockTime: { type: GraphQLLong },
    parsed: { type: ParsedTransaction },
    meta: { type: ParsedConfirmedTransactionMeta },
  },
})

// --------------------- TOKEN -----------------------------
