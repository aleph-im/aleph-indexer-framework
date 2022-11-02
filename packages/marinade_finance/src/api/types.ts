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

// if you have some errors here most probably will be solved by changing the order of types

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
    Initialize: { value: 'Initialize' },
    ChangeAuthority: { value: 'ChangeAuthority' },
    AddValidator: { value: 'AddValidator' },
    RemoveValidator: { value: 'RemoveValidator' },
    SetValidatorScore: { value: 'SetValidatorScore' },
    ConfigValidatorSystem: { value: 'ConfigValidatorSystem' },
    Deposit: { value: 'Deposit' },
    DepositStakeAccount: { value: 'DepositStakeAccount' },
    LiquidUnstake: { value: 'LiquidUnstake' },
    AddLiquidity: { value: 'AddLiquidity' },
    RemoveLiquidity: { value: 'RemoveLiquidity' },
    SetLpParams: { value: 'SetLpParams' },
    ConfigMarinade: { value: 'ConfigMarinade' },
    OrderUnstake: { value: 'OrderUnstake' },
    Claim: { value: 'Claim' },
    StakeReserve: { value: 'StakeReserve' },
    UpdateActive: { value: 'UpdateActive' },
    UpdateDeactivated: { value: 'UpdateDeactivated' },
    DeactivateStake: { value: 'DeactivateStake' },
    EmergencyUnstake: { value: 'EmergencyUnstake' },
    PartialUnstake: { value: 'PartialUnstake' },
    MergeStakes: { value: 'MergeStakes' },
  },
})

const commonEventFields = {
  id: { type: new GraphQLNonNull(GraphQLString) },
  timestamp: { type: GraphQLLong },
  type: { type: new GraphQLNonNull(ParsedEvents) },
  account: { type: new GraphQLNonNull(GraphQLString) },
}

const Event = new GraphQLInterfaceType({
  name: 'Event',
  fields: {
    ...commonEventFields,
  },
})

export const Initialize = new GraphQLObjectType({
  name: 'Initialize',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Initialize,
  fields: {
    ...commonEventFields,
    creatorauthority: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    msolmint: { type: new GraphQLNonNull(GraphQLString) },
    operationalsolaccount: { type: new GraphQLNonNull(GraphQLString) },
    liqpool: { type: new GraphQLNonNull(GraphQLString) },
    treasurymsolaccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ChangeAuthority = new GraphQLObjectType({
  name: 'ChangeAuthority',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ChangeAuthority,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminauthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const AddValidator = new GraphQLObjectType({
  name: 'AddValidator',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.AddValidator,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    validatorvote: { type: new GraphQLNonNull(GraphQLString) },
    duplicationflag: { type: new GraphQLNonNull(GraphQLString) },
    rentpayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const RemoveValidator = new GraphQLObjectType({
  name: 'RemoveValidator',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.RemoveValidator,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    duplicationflag: { type: new GraphQLNonNull(GraphQLString) },
    operationalsolaccount: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const SetValidatorScore = new GraphQLObjectType({
  name: 'SetValidatorScore',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.SetValidatorScore,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ConfigValidatorSystem = new GraphQLObjectType({
  name: 'ConfigValidatorSystem',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigValidatorSystem,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const Deposit = new GraphQLObjectType({
  name: 'Deposit',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Deposit,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolmint: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolsollegpda: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsolleg: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsollegauthority: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    transferfrom: { type: new GraphQLNonNull(GraphQLString) },
    mintto: { type: new GraphQLNonNull(GraphQLString) },
    msolmintauthority: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const DepositStakeAccount = new GraphQLObjectType({
  name: 'DepositStakeAccount',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.DepositStakeAccount,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    stakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    stakeauthority: { type: new GraphQLNonNull(GraphQLString) },
    duplicationflag: { type: new GraphQLNonNull(GraphQLString) },
    rentpayer: { type: new GraphQLNonNull(GraphQLString) },
    msolmint: { type: new GraphQLNonNull(GraphQLString) },
    mintto: { type: new GraphQLNonNull(GraphQLString) },
    msolmintauthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const LiquidUnstake = new GraphQLObjectType({
  name: 'LiquidUnstake',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.LiquidUnstake,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolmint: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolsollegpda: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsolleg: { type: new GraphQLNonNull(GraphQLString) },
    treasurymsolaccount: { type: new GraphQLNonNull(GraphQLString) },
    getmsolfrom: { type: new GraphQLNonNull(GraphQLString) },
    getmsolfromauthority: { type: new GraphQLNonNull(GraphQLString) },
    transfersolto: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const AddLiquidity = new GraphQLObjectType({
  name: 'AddLiquidity',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.AddLiquidity,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    lpmint: { type: new GraphQLNonNull(GraphQLString) },
    lpmintauthority: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsolleg: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolsollegpda: { type: new GraphQLNonNull(GraphQLString) },
    transferfrom: { type: new GraphQLNonNull(GraphQLString) },
    mintto: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const RemoveLiquidity = new GraphQLObjectType({
  name: 'RemoveLiquidity',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.RemoveLiquidity,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    lpmint: { type: new GraphQLNonNull(GraphQLString) },
    burnfrom: { type: new GraphQLNonNull(GraphQLString) },
    burnfromauthority: { type: new GraphQLNonNull(GraphQLString) },
    transfersolto: { type: new GraphQLNonNull(GraphQLString) },
    transfermsolto: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolsollegpda: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsolleg: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsollegauthority: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const SetLpParams = new GraphQLObjectType({
  name: 'SetLpParams',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.SetLpParams,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminauthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const ConfigMarinade = new GraphQLObjectType({
  name: 'ConfigMarinade',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigMarinade,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminauthority: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const OrderUnstake = new GraphQLObjectType({
  name: 'OrderUnstake',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.OrderUnstake,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolmint: { type: new GraphQLNonNull(GraphQLString) },
    burnmsolfrom: { type: new GraphQLNonNull(GraphQLString) },
    burnmsolauthority: { type: new GraphQLNonNull(GraphQLString) },
    newticketaccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const Claim = new GraphQLObjectType({
  name: 'Claim',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Claim,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    ticketaccount: { type: new GraphQLNonNull(GraphQLString) },
    transfersolto: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const StakeReserve = new GraphQLObjectType({
  name: 'StakeReserve',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.StakeReserve,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    validatorvote: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    stakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    stakedepositauthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    epochschedule: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    stakehistory: { type: new GraphQLNonNull(GraphQLString) },
    stakeconfig: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const UpdateActive = new GraphQLObjectType({
  name: 'UpdateActive',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UpdateActive,
  fields: {
    ...commonEventFields,
    common: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const UpdateDeactivated = new GraphQLObjectType({
  name: 'UpdateDeactivated',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UpdateDeactivated,
  fields: {
    ...commonEventFields,
    common: { type: new GraphQLNonNull(GraphQLString) },
    operationalsolaccount: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const DeactivateStake = new GraphQLObjectType({
  name: 'DeactivateStake',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.DeactivateStake,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    stakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    stakedepositauthority: { type: new GraphQLNonNull(GraphQLString) },
    splitstakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    splitstakerentpayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    epochschedule: { type: new GraphQLNonNull(GraphQLString) },
    stakehistory: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const EmergencyUnstake = new GraphQLObjectType({
  name: 'EmergencyUnstake',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.EmergencyUnstake,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatormanagerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    stakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    stakedepositauthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const PartialUnstake = new GraphQLObjectType({
  name: 'PartialUnstake',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.PartialUnstake,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatormanagerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    stakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    stakedepositauthority: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    splitstakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    splitstakerentpayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    stakehistory: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const MergeStakes = new GraphQLObjectType({
  name: 'MergeStakes',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.MergeStakes,
  fields: {
    ...commonEventFields,
    state: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    destinationstake: { type: new GraphQLNonNull(GraphQLString) },
    sourcestake: { type: new GraphQLNonNull(GraphQLString) },
    stakedepositauthority: { type: new GraphQLNonNull(GraphQLString) },
    stakewithdrawauthority: { type: new GraphQLNonNull(GraphQLString) },
    operationalsolaccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    stakehistory: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const Events = new GraphQLList(Event)

export const types = [
  Initialize,
  ChangeAuthority,
  AddValidator,
  RemoveValidator,
  SetValidatorScore,
  ConfigValidatorSystem,
  Deposit,
  DepositStakeAccount,
  LiquidUnstake,
  AddLiquidity,
  RemoveLiquidity,
  SetLpParams,
  ConfigMarinade,
  OrderUnstake,
  Claim,
  StakeReserve,
  UpdateActive,
  UpdateDeactivated,
  DeactivateStake,
  EmergencyUnstake,
  PartialUnstake,
  MergeStakes,
]
