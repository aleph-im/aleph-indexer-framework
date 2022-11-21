import { GraphQLBoolean, GraphQLInt } from 'graphql'
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

export const Fee = new GraphQLObjectType({
  name: 'Fee',
  fields: {
    basisPoints: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const LiqPoolInitializeData = new GraphQLObjectType({
  name: 'LiqPoolInitializeData',
  fields: {
    lpLiquidityTarget: { type: new GraphQLNonNull(GraphQLBigNumber) },
    lpMaxFee: { type: new GraphQLNonNull(Fee) },
    lpMinFee: { type: new GraphQLNonNull(Fee) },
    lpTreasuryCut: { type: new GraphQLNonNull(Fee) },
  },
})

export const InitializeData = new GraphQLObjectType({
  name: 'InitializeData',
  fields: {
    adminAuthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorManagerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    minStake: { type: new GraphQLNonNull(GraphQLBigNumber) },
    rewardFee: { type: new GraphQLNonNull(Fee) },
    liqPool: { type: new GraphQLNonNull(LiqPoolInitializeData) },
    additionalStakeRecordSpace: { type: new GraphQLNonNull(GraphQLInt) },
    additionalValidatorRecordSpace: { type: new GraphQLNonNull(GraphQLInt) },
    slotsForStakeDelta: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const ChangeAuthorityData = new GraphQLObjectType({
  name: 'ChangeAuthorityData',
  fields: {
    admin: { type: new GraphQLNonNull(GraphQLString) },
    validatorManager: { type: new GraphQLNonNull(GraphQLString) },
    operationalSolAccount: { type: new GraphQLNonNull(GraphQLString) },
    treasuryMsolAccount: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ConfigLpParams = new GraphQLObjectType({
  name: 'ConfigLpParams',
  fields: {
    minFee: { type: new GraphQLNonNull(Fee) },
    maxFee: { type: new GraphQLNonNull(Fee) },
    liquidityTarget: { type: new GraphQLNonNull(GraphQLBigNumber) },
    treasuryCut: { type: new GraphQLNonNull(Fee) },
  },
})

export const ConfigMarinadeParams = new GraphQLObjectType({
  name: 'ConfigMarinadeParams',
  fields: {
    rewardsFee: { type: new GraphQLNonNull(Fee) },
    slotsForStakeDelta: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minStake: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minDeposit: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minWithdraw: { type: new GraphQLNonNull(GraphQLBigNumber) },
    stakingSolCap: { type: new GraphQLNonNull(GraphQLBigNumber) },
    liquiditySolCap: { type: new GraphQLNonNull(GraphQLBigNumber) },
    autoAddValidatorEnabled: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
})

export const LiqPool = new GraphQLObjectType({
  name: 'LiqPool',
  fields: {
    lpMint: { type: new GraphQLNonNull(GraphQLString) },
    lpMintAuthorityBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    solLegBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    msolLegAuthorityBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    msolLeg: { type: new GraphQLNonNull(GraphQLString) },
    lpLiquidityTarget: { type: new GraphQLNonNull(GraphQLBigNumber) },
    lpMaxFee: { type: new GraphQLNonNull(Fee) },
    lpMinFee: { type: new GraphQLNonNull(Fee) },
    treasuryCut: { type: new GraphQLNonNull(Fee) },
    lpSupply: { type: new GraphQLNonNull(GraphQLBigNumber) },
    lentFromSolLeg: { type: new GraphQLNonNull(GraphQLBigNumber) },
    liquiditySolCap: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const List = new GraphQLObjectType({
  name: 'List',
  fields: {
    account: { type: new GraphQLNonNull(GraphQLString) },
    itemSize: { type: new GraphQLNonNull(GraphQLInt) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
    newAccount: { type: new GraphQLNonNull(GraphQLString) },
    copiedCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const StakeRecord = new GraphQLObjectType({
  name: 'StakeRecord',
  fields: {
    stakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    lastUpdateDelegatedLamports: { type: new GraphQLNonNull(GraphQLBigNumber) },
    lastUpdateEpoch: { type: new GraphQLNonNull(GraphQLBigNumber) },
    isEmergencyUnstaking: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const StakeSystem = new GraphQLObjectType({
  name: 'StakeSystem',
  fields: {
    stakeList: { type: new GraphQLNonNull(List) },
    delayedUnstakeCoolingDown: { type: new GraphQLNonNull(GraphQLBigNumber) },
    stakeDepositBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    stakeWithdrawBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    slotsForStakeDelta: { type: new GraphQLNonNull(GraphQLBigNumber) },
    lastStakeDeltaEpoch: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minStake: { type: new GraphQLNonNull(GraphQLBigNumber) },
    extraStakeDeltaRuns: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const ValidatorRecord = new GraphQLObjectType({
  name: 'ValidatorRecord',
  fields: {
    validatorAccount: { type: new GraphQLNonNull(GraphQLString) },
    activeBalance: { type: new GraphQLNonNull(GraphQLBigNumber) },
    score: { type: new GraphQLNonNull(GraphQLInt) },
    lastStakeDeltaEpoch: { type: new GraphQLNonNull(GraphQLBigNumber) },
    duplicationFlagBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const ValidatorSystem = new GraphQLObjectType({
  name: 'ValidatorSystem',
  fields: {
    validatorList: { type: new GraphQLNonNull(List) },
    managerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    totalValidatorScore: { type: new GraphQLNonNull(GraphQLInt) },
    totalActiveBalance: { type: new GraphQLNonNull(GraphQLBigNumber) },
    autoAddValidatorEnabled: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

// ------------------- STATS ---------------------------

export const AccessTimeStats = new GraphQLObjectType({
  name: 'MarinadeFinanceInfo',
  fields: {
    accesses: { type: new GraphQLNonNull(GraphQLInt) },
    accessesByProgramId: { type: new GraphQLNonNull(GraphQLJSON) },
    startTimestamp: { type: new GraphQLNonNull(GraphQLLong) },
    endTimestamp: { type: new GraphQLNonNull(GraphQLLong) },
  },
})

export const TotalAccounts = new GraphQLObjectType({
  name: 'TotalAccounts',
  fields: {
    State: { type: new GraphQLNonNull(GraphQLInt) },
    TicketAccountData: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const GlobalMarinadeFinanceStats = new GraphQLObjectType({
  name: 'GlobalMarinadeFinanceStats',
  fields: {
    totalAccounts: { type: new GraphQLNonNull(TotalAccounts) },
    totalAccesses: { type: new GraphQLNonNull(GraphQLInt) },
    totalAccessesByProgramId: { type: new GraphQLNonNull(GraphQLJSON) },
    startTimestamp: { type: new GraphQLNonNull(GraphQLLong) },
    endTimestamp: { type: new GraphQLNonNull(GraphQLLong) },
  },
})

export const MarinadeFinanceStats = new GraphQLObjectType({
  name: 'MarinadeFinanceStats',
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
    State: { value: 'State' },
    TicketAccountData: { value: 'TicketAccountData' },
  },
})

export const State = new GraphQLObjectType({
  name: 'State',
  fields: {
    msolMint: { type: new GraphQLNonNull(GraphQLString) },
    adminAuthority: { type: new GraphQLNonNull(GraphQLString) },
    operationalSolAccount: { type: new GraphQLNonNull(GraphQLString) },
    treasuryMsolAccount: { type: new GraphQLNonNull(GraphQLString) },
    reserveBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    msolMintAuthorityBumpSeed: { type: new GraphQLNonNull(GraphQLInt) },
    rentExemptForTokenAcc: { type: new GraphQLNonNull(GraphQLBigNumber) },
    rewardFee: { type: new GraphQLNonNull(Fee) },
    stakeSystem: { type: new GraphQLNonNull(StakeSystem) },
    validatorSystem: { type: new GraphQLNonNull(ValidatorSystem) },
    liqPool: { type: new GraphQLNonNull(LiqPool) },
    availableReserveBalance: { type: new GraphQLNonNull(GraphQLBigNumber) },
    msolSupply: { type: new GraphQLNonNull(GraphQLBigNumber) },
    msolPrice: { type: new GraphQLNonNull(GraphQLBigNumber) },
    circulatingTicketCount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    circulatingTicketBalance: { type: new GraphQLNonNull(GraphQLBigNumber) },
    lentFromReserve: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minDeposit: { type: new GraphQLNonNull(GraphQLBigNumber) },
    minWithdraw: { type: new GraphQLNonNull(GraphQLBigNumber) },
    stakingSolCap: { type: new GraphQLNonNull(GraphQLBigNumber) },
    emergencyCoolingDown: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const TicketAccountData = new GraphQLObjectType({
  name: 'TicketAccountData',
  fields: {
    stateAddress: { type: new GraphQLNonNull(GraphQLString) },
    beneficiary: { type: new GraphQLNonNull(GraphQLString) },
    lamportsAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
    createdEpoch: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const ParsedAccountsData = new GraphQLUnionType({
  name: 'ParsedAccountsData',
  types: [State, TicketAccountData],
  resolveType: (obj) => {
    // here is selected a unique property of each account to discriminate between types
    if (obj.emergencyCoolingDown) {
      return 'State'
    }
    if (obj.createdEpoch) {
      return 'TicketAccountData'
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

export const MarinadeFinanceAccountsInfo = new GraphQLObjectType({
  name: 'MarinadeFinanceAccountsInfo',
  interfaces: [Account],
  fields: {
    ...commonAccountInfoFields,
    data: { type: new GraphQLNonNull(ParsedAccountsData) },
  },
})

export const AccountsInfo = new GraphQLList(MarinadeFinanceAccountsInfo)

// ------------------- EVENTS --------------------------

export const ParsedEvents = new GraphQLEnumType({
  name: 'ParsedEvents',
  values: {
    InitializeEvent: { value: 'InitializeEvent' },
    ChangeAuthorityEvent: { value: 'ChangeAuthorityEvent' },
    AddValidatorEvent: { value: 'AddValidatorEvent' },
    RemoveValidatorEvent: { value: 'RemoveValidatorEvent' },
    SetValidatorScoreEvent: { value: 'SetValidatorScoreEvent' },
    ConfigValidatorSystemEvent: { value: 'ConfigValidatorSystemEvent' },
    DepositEvent: { value: 'DepositEvent' },
    DepositStakeAccountEvent: { value: 'DepositStakeAccountEvent' },
    LiquidUnstakeEvent: { value: 'LiquidUnstakeEvent' },
    AddLiquidityEvent: { value: 'AddLiquidityEvent' },
    RemoveLiquidityEvent: { value: 'RemoveLiquidityEvent' },
    ConfigLpEvent: { value: 'ConfigLpEvent' },
    ConfigMarinadeEvent: { value: 'ConfigMarinadeEvent' },
    OrderUnstakeEvent: { value: 'OrderUnstakeEvent' },
    ClaimEvent: { value: 'ClaimEvent' },
    StakeReserveEvent: { value: 'StakeReserveEvent' },
    UpdateActiveEvent: { value: 'UpdateActiveEvent' },
    UpdateDeactivatedEvent: { value: 'UpdateDeactivatedEvent' },
    DeactivateStakeEvent: { value: 'DeactivateStakeEvent' },
    EmergencyUnstakeEvent: { value: 'EmergencyUnstakeEvent' },
    PartialUnstakeEvent: { value: 'PartialUnstakeEvent' },
    MergeStakesEvent: { value: 'MergeStakesEvent' },
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

export const InitializeEventAccounts = new GraphQLObjectType({
  name: 'InitializeEventAccounts',
  fields: {
    creatorAuthority: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservePda: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    msolMint: { type: new GraphQLNonNull(GraphQLString) },
    operationalSolAccount: { type: new GraphQLNonNull(GraphQLString) },
    liqPool: { type: new GraphQLNonNull(GraphQLString) },
    treasuryMsolAccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const InitializeEvent = new GraphQLObjectType({
  name: 'InitializeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Initialize,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(InitializeData) },
    accounts: { type: new GraphQLNonNull(InitializeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const ChangeAuthorityEventAccounts = new GraphQLObjectType({
  name: 'ChangeAuthorityEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminAuthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ChangeAuthorityEvent = new GraphQLObjectType({
  name: 'ChangeAuthorityEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ChangeAuthority,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(ChangeAuthorityData) },
    accounts: { type: new GraphQLNonNull(ChangeAuthorityEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const AddValidatorEventAccounts = new GraphQLObjectType({
  name: 'AddValidatorEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    validatorVote: { type: new GraphQLNonNull(GraphQLString) },
    duplicationFlag: { type: new GraphQLNonNull(GraphQLString) },
    rentPayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const AddValidatorEventData = new GraphQLObjectType({
  name: 'AddValidatorEventData',
  fields: {
    score: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const AddValidatorEvent = new GraphQLObjectType({
  name: 'AddValidatorEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.AddValidator,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(AddValidatorEventData) },
    accounts: { type: new GraphQLNonNull(AddValidatorEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const RemoveValidatorEventAccounts = new GraphQLObjectType({
  name: 'RemoveValidatorEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    duplicationFlag: { type: new GraphQLNonNull(GraphQLString) },
    operationalSolAccount: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const RemoveValidatorEventData = new GraphQLObjectType({
  name: 'RemoveValidatorEventData',
  fields: {
    index: { type: new GraphQLNonNull(GraphQLInt) },
    validatorVote: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const RemoveValidatorEvent = new GraphQLObjectType({
  name: 'RemoveValidatorEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.RemoveValidator,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(RemoveValidatorEventData) },
    accounts: { type: new GraphQLNonNull(RemoveValidatorEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const SetValidatorScoreEventAccounts = new GraphQLObjectType({
  name: 'SetValidatorScoreEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const SetValidatorScoreEventData = new GraphQLObjectType({
  name: 'SetValidatorScoreEventData',
  fields: {
    index: { type: new GraphQLNonNull(GraphQLInt) },
    validatorVote: { type: new GraphQLNonNull(GraphQLString) },
    score: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const SetValidatorScoreEvent = new GraphQLObjectType({
  name: 'SetValidatorScoreEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.SetValidatorScore,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(SetValidatorScoreEventData) },
    accounts: { type: new GraphQLNonNull(SetValidatorScoreEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const ConfigValidatorSystemEventAccounts = new GraphQLObjectType({
  name: 'ConfigValidatorSystemEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerAuthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ConfigValidatorSystemEventData = new GraphQLObjectType({
  name: 'ConfigValidatorSystemEventData',
  fields: {
    extraRuns: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const ConfigValidatorSystemEvent = new GraphQLObjectType({
  name: 'ConfigValidatorSystemEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigValidatorSystem,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(ConfigValidatorSystemEventData) },
    accounts: { type: new GraphQLNonNull(ConfigValidatorSystemEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const DepositEventAccounts = new GraphQLObjectType({
  name: 'DepositEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolMint: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolSolLegPda: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolMsolLeg: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolMsolLegAuthority: { type: new GraphQLNonNull(GraphQLString) },
    reservePda: { type: new GraphQLNonNull(GraphQLString) },
    transferFrom: { type: new GraphQLNonNull(GraphQLString) },
    mintTo: { type: new GraphQLNonNull(GraphQLString) },
    msolMintAuthority: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const DepositEventData = new GraphQLObjectType({
  name: 'DepositEventData',
  fields: {
    lamports: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const DepositEvent = new GraphQLObjectType({
  name: 'DepositEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Deposit,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(DepositEventData) },
    accounts: { type: new GraphQLNonNull(DepositEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const DepositStakeAccountEventAccounts = new GraphQLObjectType({
  name: 'DepositStakeAccountEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    stakeAuthority: { type: new GraphQLNonNull(GraphQLString) },
    duplicationFlag: { type: new GraphQLNonNull(GraphQLString) },
    rentPayer: { type: new GraphQLNonNull(GraphQLString) },
    msolMint: { type: new GraphQLNonNull(GraphQLString) },
    mintTo: { type: new GraphQLNonNull(GraphQLString) },
    msolMintAuthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
    stakeProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const DepositStakeAccountEventData = new GraphQLObjectType({
  name: 'DepositStakeAccountEventData',
  fields: {
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const DepositStakeAccountEvent = new GraphQLObjectType({
  name: 'DepositStakeAccountEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.DepositStakeAccount,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(DepositStakeAccountEventData) },
    accounts: { type: new GraphQLNonNull(DepositStakeAccountEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const LiquidUnstakeEventAccounts = new GraphQLObjectType({
  name: 'LiquidUnstakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolMint: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolSolLegPda: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolMsolLeg: { type: new GraphQLNonNull(GraphQLString) },
    treasuryMsolAccount: { type: new GraphQLNonNull(GraphQLString) },
    getMsolFrom: { type: new GraphQLNonNull(GraphQLString) },
    getMsolFromAuthority: { type: new GraphQLNonNull(GraphQLString) },
    transferSolTo: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const LiquidUnstakeEventData = new GraphQLObjectType({
  name: 'LiquidUnstakeEventData',
  fields: {
    msolAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const LiquidUnstakeEvent = new GraphQLObjectType({
  name: 'LiquidUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.LiquidUnstake,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(LiquidUnstakeEventData) },
    accounts: { type: new GraphQLNonNull(LiquidUnstakeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const AddLiquidityEventAccounts = new GraphQLObjectType({
  name: 'AddLiquidityEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    lpMint: { type: new GraphQLNonNull(GraphQLString) },
    lpMintAuthority: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolMsolLeg: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolSolLegPda: { type: new GraphQLNonNull(GraphQLString) },
    transferFrom: { type: new GraphQLNonNull(GraphQLString) },
    mintTo: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const AddLiquidityEventData = new GraphQLObjectType({
  name: 'AddLiquidityEventData',
  fields: {
    lamports: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const AddLiquidityEvent = new GraphQLObjectType({
  name: 'AddLiquidityEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.AddLiquidity,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(AddLiquidityEventData) },
    accounts: { type: new GraphQLNonNull(AddLiquidityEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const RemoveLiquidityEventAccounts = new GraphQLObjectType({
  name: 'RemoveLiquidityEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    lpMint: { type: new GraphQLNonNull(GraphQLString) },
    burnFrom: { type: new GraphQLNonNull(GraphQLString) },
    burnFromAuthority: { type: new GraphQLNonNull(GraphQLString) },
    transferSolTo: { type: new GraphQLNonNull(GraphQLString) },
    transferMsolTo: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolSolLegPda: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolMsolLeg: { type: new GraphQLNonNull(GraphQLString) },
    liqPoolMsolLegAuthority: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const RemoveLiquidityEventData = new GraphQLObjectType({
  name: 'RemoveLiquidityEventData',
  fields: {
    tokens: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const RemoveLiquidityEvent = new GraphQLObjectType({
  name: 'RemoveLiquidityEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.RemoveLiquidity,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(RemoveLiquidityEventData) },
    accounts: { type: new GraphQLNonNull(RemoveLiquidityEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const ConfigLpEventAccounts = new GraphQLObjectType({
  name: 'ConfigLpEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminAuthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ConfigLpEvent = new GraphQLObjectType({
  name: 'ConfigLpEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigLp,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(ConfigLpParams) },
    accounts: { type: new GraphQLNonNull(ConfigLpEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const ConfigMarinadeEventAccounts = new GraphQLObjectType({
  name: 'ConfigMarinadeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminAuthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ConfigMarinadeEvent = new GraphQLObjectType({
  name: 'ConfigMarinadeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigMarinade,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(ConfigMarinadeParams) },
    accounts: { type: new GraphQLNonNull(ConfigMarinadeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const OrderUnstakeEventAccounts = new GraphQLObjectType({
  name: 'OrderUnstakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolMint: { type: new GraphQLNonNull(GraphQLString) },
    burnMsolFrom: { type: new GraphQLNonNull(GraphQLString) },
    burnMsolAuthority: { type: new GraphQLNonNull(GraphQLString) },
    newTicketAccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    tokenProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const OrderUnstakeEventData = new GraphQLObjectType({
  name: 'OrderUnstakeEventData',
  fields: {
    msolAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const OrderUnstakeEvent = new GraphQLObjectType({
  name: 'OrderUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.OrderUnstake,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(OrderUnstakeEventData) },
    accounts: { type: new GraphQLNonNull(OrderUnstakeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const ClaimEventAccounts = new GraphQLObjectType({
  name: 'ClaimEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservePda: { type: new GraphQLNonNull(GraphQLString) },
    ticketAccount: { type: new GraphQLNonNull(GraphQLString) },
    transferSolTo: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ClaimEvent = new GraphQLObjectType({
  name: 'ClaimEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Claim,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(ClaimEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const StakeReserveEventAccounts = new GraphQLObjectType({
  name: 'StakeReserveEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    validatorVote: { type: new GraphQLNonNull(GraphQLString) },
    reservePda: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    stakeDepositAuthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    epochSchedule: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    stakeHistory: { type: new GraphQLNonNull(GraphQLString) },
    stakeConfig: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    stakeProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const StakeReserveEventData = new GraphQLObjectType({
  name: 'StakeReserveEventData',
  fields: {
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const StakeReserveEvent = new GraphQLObjectType({
  name: 'StakeReserveEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.StakeReserve,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(StakeReserveEventData) },
    accounts: { type: new GraphQLNonNull(StakeReserveEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const UpdateActiveEventAccounts = new GraphQLObjectType({
  name: 'UpdateActiveEventAccounts',
  fields: {
    common: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const UpdateActiveEventData = new GraphQLObjectType({
  name: 'UpdateActiveEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const UpdateActiveEvent = new GraphQLObjectType({
  name: 'UpdateActiveEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UpdateActive,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(UpdateActiveEventData) },
    accounts: { type: new GraphQLNonNull(UpdateActiveEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const UpdateDeactivatedEventAccounts = new GraphQLObjectType({
  name: 'UpdateDeactivatedEventAccounts',
  fields: {
    common: { type: new GraphQLNonNull(GraphQLString) },
    operationalSolAccount: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const UpdateDeactivatedEventData = new GraphQLObjectType({
  name: 'UpdateDeactivatedEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const UpdateDeactivatedEvent = new GraphQLObjectType({
  name: 'UpdateDeactivatedEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UpdateDeactivated,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(UpdateDeactivatedEventData) },
    accounts: { type: new GraphQLNonNull(UpdateDeactivatedEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const DeactivateStakeEventAccounts = new GraphQLObjectType({
  name: 'DeactivateStakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservePda: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    stakeDepositAuthority: { type: new GraphQLNonNull(GraphQLString) },
    splitStakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    splitStakeRentPayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    epochSchedule: { type: new GraphQLNonNull(GraphQLString) },
    stakeHistory: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    stakeProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const DeactivateStakeEventData = new GraphQLObjectType({
  name: 'DeactivateStakeEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const DeactivateStakeEvent = new GraphQLObjectType({
  name: 'DeactivateStakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.DeactivateStake,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(DeactivateStakeEventData) },
    accounts: { type: new GraphQLNonNull(DeactivateStakeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const EmergencyUnstakeEventAccounts = new GraphQLObjectType({
  name: 'EmergencyUnstakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatorManagerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    stakeDepositAuthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    stakeProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const EmergencyUnstakeEventData = new GraphQLObjectType({
  name: 'EmergencyUnstakeEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const EmergencyUnstakeEvent = new GraphQLObjectType({
  name: 'EmergencyUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.EmergencyUnstake,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(EmergencyUnstakeEventData) },
    accounts: { type: new GraphQLNonNull(EmergencyUnstakeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const PartialUnstakeEventAccounts = new GraphQLObjectType({
  name: 'PartialUnstakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatorManagerAuthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    stakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    stakeDepositAuthority: { type: new GraphQLNonNull(GraphQLString) },
    reservePda: { type: new GraphQLNonNull(GraphQLString) },
    splitStakeAccount: { type: new GraphQLNonNull(GraphQLString) },
    splitStakeRentPayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    stakeHistory: { type: new GraphQLNonNull(GraphQLString) },
    systemProgram: { type: new GraphQLNonNull(GraphQLString) },
    stakeProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const PartialUnstakeEventData = new GraphQLObjectType({
  name: 'PartialUnstakeEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
    desiredUnstakeAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  },
})

export const PartialUnstakeEvent = new GraphQLObjectType({
  name: 'PartialUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.PartialUnstake,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(PartialUnstakeEventData) },
    accounts: { type: new GraphQLNonNull(PartialUnstakeEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const MergeStakesEventAccounts = new GraphQLObjectType({
  name: 'MergeStakesEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    stakeList: { type: new GraphQLNonNull(GraphQLString) },
    validatorList: { type: new GraphQLNonNull(GraphQLString) },
    destinationStake: { type: new GraphQLNonNull(GraphQLString) },
    sourceStake: { type: new GraphQLNonNull(GraphQLString) },
    stakeDepositAuthority: { type: new GraphQLNonNull(GraphQLString) },
    stakeWithdrawAuthority: { type: new GraphQLNonNull(GraphQLString) },
    operationalSolAccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    stakeHistory: { type: new GraphQLNonNull(GraphQLString) },
    stakeProgram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const MergeStakesEventData = new GraphQLObjectType({
  name: 'MergeStakesEventData',
  fields: {
    destinationStakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    sourceStakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const MergeStakesEvent = new GraphQLObjectType({
  name: 'MergeStakesEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.MergeStakes,
  fields: {
    ...commonEventFields,
    data: { type: new GraphQLNonNull(MergeStakesEventData) },
    accounts: { type: new GraphQLNonNull(MergeStakesEventAccounts) },
  },
})

/*----------------------------------------------------------------------*/

export const Events = new GraphQLList(Event)

export const types = [
  InitializeEvent,
  ChangeAuthorityEvent,
  AddValidatorEvent,
  RemoveValidatorEvent,
  SetValidatorScoreEvent,
  ConfigValidatorSystemEvent,
  DepositEvent,
  DepositStakeAccountEvent,
  LiquidUnstakeEvent,
  AddLiquidityEvent,
  RemoveLiquidityEvent,
  ConfigLpEvent,
  ConfigMarinadeEvent,
  OrderUnstakeEvent,
  ClaimEvent,
  StakeReserveEvent,
  UpdateActiveEvent,
  UpdateDeactivatedEvent,
  DeactivateStakeEvent,
  EmergencyUnstakeEvent,
  PartialUnstakeEvent,
  MergeStakesEvent,
]
