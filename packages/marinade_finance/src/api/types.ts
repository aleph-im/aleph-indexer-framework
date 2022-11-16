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

export const InitializeEventAccounts = new GraphQLObjectType({
  name: 'InitializeEventAccounts',
  fields: {
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
  }
})

export const InitializeEventData = new GraphQLObjectType({
  name: 'InitializeEventData',
  fields: {
    // @todo: pull this one level up?
    data: { type: new GraphQLNonNull(InitializeData) }
  }
})

export const InitializeEvent = new GraphQLObjectType({
  name: 'InitializeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Initialize,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(InitializeEventAccounts) },
    data: { type: new GraphQLNonNull(InitializeEventData) },
  },
})

export const ChangeAuthorityEventAccounts = new GraphQLObjectType({
  name: 'ChangeAuthorityEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminauthority: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const ChangeAuthorityEventData = new GraphQLObjectType({
  name: 'ChangeAuthorityEventData',
  fields: {
    // @todo: pull this one level up?
    data: { type: new GraphQLNonNull(ChangeAuthorityData) }
  }
})

export const ChangeAuthorityEvent = new GraphQLObjectType({
  name: 'ChangeAuthorityEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ChangeAuthority,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(ChangeAuthorityEventAccounts) },
    data: { type: new GraphQLNonNull(ChangeAuthorityEventData) },
  },
})

export const AddValidatorEventAccounts = new GraphQLObjectType({
  name: 'AddValidatorEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    validatorvote: { type: new GraphQLNonNull(GraphQLString) },
    duplicationflag: { type: new GraphQLNonNull(GraphQLString) },
    rentpayer: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const AddValidatorEventData = new GraphQLObjectType({
  name: 'AddValidatorEventData',
  fields: {
    score: { type: new GraphQLNonNull(GraphQLInt) }
  }
})

export const AddValidatorEvent = new GraphQLObjectType({
  name: 'AddValidatorEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.AddValidator,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(AddValidatorEventAccounts) },
    data: { type: new GraphQLNonNull(AddValidatorEventData) },
  },
})

export const RemoveValidatorEventAccounts = new GraphQLObjectType({
  name: 'RemoveValidatorEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    duplicationflag: { type: new GraphQLNonNull(GraphQLString) },
    operationalsolaccount: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const RemoveValidatorEventData = new GraphQLObjectType({
  name: 'RemoveValidatorEventData',
  fields: {
    index: { type: new GraphQLNonNull(GraphQLInt) },
    validatorVote: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const RemoveValidatorEvent = new GraphQLObjectType({
  name: 'RemoveValidatorEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.RemoveValidator,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(RemoveValidatorEventAccounts) },
    data: { type: new GraphQLNonNull(RemoveValidatorEventData) },
  },
})

export const SetValidatorScoreEventAccounts = new GraphQLObjectType({
  name: 'SetValidatorScoreEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const SetValidatorScoreEventData = new GraphQLObjectType({
  name: 'SetValidatorScoreEventData',
  fields: {
    index: { type: new GraphQLNonNull(GraphQLInt) },
    validatorVote: { type: new GraphQLNonNull(GraphQLString) },
    score: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const SetValidatorScoreEvent = new GraphQLObjectType({
  name: 'SetValidatorScoreEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.SetValidatorScore,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(SetValidatorScoreEventAccounts) },
    data: { type: new GraphQLNonNull(SetValidatorScoreEventData) },
  },
})

export const ConfigValidatorSystemEventAccounts = new GraphQLObjectType({
  name: 'ConfigValidatorSystemEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    managerauthority: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const ConfigValidatorSystemEventData = new GraphQLObjectType({
  name: 'ConfigValidatorSystemEventData',
  fields: {
    extraRuns: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const ConfigValidatorSystemEvent = new GraphQLObjectType({
  name: 'ConfigValidatorSystemEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigValidatorSystem,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(ConfigValidatorSystemEventAccounts) },
    data: { type: new GraphQLNonNull(ConfigValidatorSystemEventData) },
  },
})

export const DepositEventAccounts = new GraphQLObjectType({
  name: 'DepositEventAccounts',
  fields: {
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
  }
})

export const DepositEventData = new GraphQLObjectType({
  name: 'DepositEventData',
  fields: {
    lamports: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const DepositEvent = new GraphQLObjectType({
  name: 'DepositEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.Deposit,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(DepositEventAccounts) },
    data: { type: new GraphQLNonNull(DepositEventData) },
  },
})

export const DepositStakeAccountEventAccounts = new GraphQLObjectType({
  name: 'DepositStakeAccountEventAccounts',
  fields: {
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
  }
})

export const DepositStakeAccountEventData = new GraphQLObjectType({
  name: 'DepositStakeAccountEventData',
  fields: {
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const DepositStakeAccountEvent = new GraphQLObjectType({
  name: 'DepositStakeAccountEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.DepositStakeAccount,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(DepositStakeAccountEventAccounts) },
    data: { type: new GraphQLNonNull(DepositStakeAccountEventData) },
  },
})

export const LiquidUnstakeEventAccounts = new GraphQLObjectType({
  name: 'LiquidUnstakeEventAccounts',
  fields: {
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
  }
})

export const LiquidUnstakeEventData = new GraphQLObjectType({
  name: 'LiquidUnstakeEventData',
  fields: {
    msolAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const LiquidUnstakeEvent = new GraphQLObjectType({
  name: 'LiquidUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.LiquidUnstake,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(LiquidUnstakeEventAccounts) },
    data: { type: new GraphQLNonNull(LiquidUnstakeEventData) },
  },
})

export const AddLiquidityEventAccounts = new GraphQLObjectType({
  name: 'AddLiquidityEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    lpmint: { type: new GraphQLNonNull(GraphQLString) },
    lpmintauthority: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolmsolleg: { type: new GraphQLNonNull(GraphQLString) },
    liqpoolsollegpda: { type: new GraphQLNonNull(GraphQLString) },
    transferfrom: { type: new GraphQLNonNull(GraphQLString) },
    mintto: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const AddLiquidityEventData = new GraphQLObjectType({
  name: 'AddLiquidityEventData',
  fields: {
    lamports: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const AddLiquidityEvent = new GraphQLObjectType({
  name: 'AddLiquidityEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.AddLiquidity,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(AddLiquidityEventAccounts) },
    data: { type: new GraphQLNonNull(AddLiquidityEventData) },
  },
})

export const RemoveLiquidityEventAccounts = new GraphQLObjectType({
  name: 'RemoveLiquidityEventAccounts',
  fields: {
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
  }
})

export const RemoveLiquidityEventData = new GraphQLObjectType({
  name: 'RemoveLiquidityEventData',
  fields: {
    tokens: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const RemoveLiquidityEvent = new GraphQLObjectType({
  name: 'RemoveLiquidityEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.RemoveLiquidity,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(RemoveLiquidityEventAccounts) },
    data: { type: new GraphQLNonNull(RemoveLiquidityEventData) },
  },
})

export const SetLpParamsEventAccounts = new GraphQLObjectType({
  name: 'SetLpParamsEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminauthority: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const SetLpParamsEventData = new GraphQLObjectType({
  name: 'SetLpParamsEventData',
  fields: {
    minFee: { type: new GraphQLNonNull(Fee) },
    maxFee: { type: new GraphQLNonNull(Fee) },
    liquidityTarget: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const SetLpParamsEvent = new GraphQLObjectType({
  name: 'SetLpParamsEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.SetLpParams,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(SetLpParamsEventAccounts) },
    data: { type: new GraphQLNonNull(SetLpParamsEventData) },
  },
})

export const ConfigMarinadeEventAccounts = new GraphQLObjectType({
  name: 'ConfigMarinadeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    adminauthority: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const ConfigMarinadeEventData = new GraphQLObjectType({
  name: 'ConfigMarinadeEventData',
  fields: {
    params: { type: new GraphQLNonNull(ConfigMarinadeParams) },
  }
})

export const ConfigMarinadeEvent = new GraphQLObjectType({
  name: 'ConfigMarinadeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.ConfigMarinade,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(ConfigMarinadeEventAccounts) },
    data: { type: new GraphQLNonNull(ConfigMarinadeEventData) },
  },
})

export const OrderUnstakeEventAccounts = new GraphQLObjectType({
  name: 'OrderUnstakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    msolmint: { type: new GraphQLNonNull(GraphQLString) },
    burnmsolfrom: { type: new GraphQLNonNull(GraphQLString) },
    burnmsolauthority: { type: new GraphQLNonNull(GraphQLString) },
    newticketaccount: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    rent: { type: new GraphQLNonNull(GraphQLString) },
    tokenprogram: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const OrderUnstakeEventData = new GraphQLObjectType({
  name: 'OrderUnstakeEventData',
  fields: {
    msolAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const OrderUnstakeEvent = new GraphQLObjectType({
  name: 'OrderUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.OrderUnstake,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(OrderUnstakeEventAccounts) },
    data: { type: new GraphQLNonNull(OrderUnstakeEventData) },
  },
})

export const ClaimEventAccounts = new GraphQLObjectType({
  name: 'ClaimEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    reservepda: { type: new GraphQLNonNull(GraphQLString) },
    ticketaccount: { type: new GraphQLNonNull(GraphQLString) },
    transfersolto: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
  }
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

export const StakeReserveEventAccounts = new GraphQLObjectType({
  name: 'StakeReserveEventAccounts',
  fields: {
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
  }
})

export const StakeReserveEventData = new GraphQLObjectType({
  name: 'StakeReserveEventData',
  fields: {
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const StakeReserveEvent = new GraphQLObjectType({
  name: 'StakeReserveEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.StakeReserve,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(StakeReserveEventAccounts) },
    data: { type: new GraphQLNonNull(StakeReserveEventData) },
  },
})

export const UpdateActiveEventAccounts = new GraphQLObjectType({
  name: 'UpdateActiveEventAccounts',
  fields: {
    common: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const UpdateActiveEventData = new GraphQLObjectType({
  name: 'UpdateActiveEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const UpdateActiveEvent = new GraphQLObjectType({
  name: 'UpdateActiveEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UpdateActive,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(UpdateActiveEventAccounts) },
    data: { type: new GraphQLNonNull(UpdateActiveEventData) },
  },
})

export const UpdateDeactivatedEventAccounts = new GraphQLObjectType({
  name: 'UpdateDeactivatedEventAccounts',
  fields: {
    common: { type: new GraphQLNonNull(GraphQLString) },
    operationalsolaccount: { type: new GraphQLNonNull(GraphQLString) },
    systemprogram: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const UpdateDeactivatedEventData = new GraphQLObjectType({
  name: 'UpdateDeactivatedEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const UpdateDeactivatedEvent = new GraphQLObjectType({
  name: 'UpdateDeactivatedEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.UpdateDeactivated,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(UpdateDeactivatedEventAccounts) },
    data: { type: new GraphQLNonNull(UpdateDeactivatedEventData) },
  },
})

export const DeactivateStakeEventAccounts = new GraphQLObjectType({
  name: 'DeactivateStakeEventAccounts',
  fields: {
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
  }
})

export const DeactivateStakeEventData = new GraphQLObjectType({
  name: 'DeactivateStakeEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const DeactivateStakeEvent = new GraphQLObjectType({
  name: 'DeactivateStakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.DeactivateStake,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(DeactivateStakeEventAccounts) },
    data: { type: new GraphQLNonNull(DeactivateStakeEventData) },
  },
})

export const EmergencyUnstakeEventAccounts = new GraphQLObjectType({
  name: 'EmergencyUnstakeEventAccounts',
  fields: {
    state: { type: new GraphQLNonNull(GraphQLString) },
    validatormanagerauthority: { type: new GraphQLNonNull(GraphQLString) },
    validatorlist: { type: new GraphQLNonNull(GraphQLString) },
    stakelist: { type: new GraphQLNonNull(GraphQLString) },
    stakeaccount: { type: new GraphQLNonNull(GraphQLString) },
    stakedepositauthority: { type: new GraphQLNonNull(GraphQLString) },
    clock: { type: new GraphQLNonNull(GraphQLString) },
    stakeprogram: { type: new GraphQLNonNull(GraphQLString) },
  }
})

export const EmergencyUnstakeEventData = new GraphQLObjectType({
  name: 'EmergencyUnstakeEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const EmergencyUnstakeEvent = new GraphQLObjectType({
  name: 'EmergencyUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.EmergencyUnstake,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(EmergencyUnstakeEventAccounts) },
    data: { type: new GraphQLNonNull(EmergencyUnstakeEventData) },
  },
})

export const PartialUnstakeEventAccounts = new GraphQLObjectType({
  name: 'PartialUnstakeEventAccounts',
  fields: {
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
  }
})

export const PartialUnstakeEventData = new GraphQLObjectType({
  name: 'PartialUnstakeEventData',
  fields: {
    stakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
    desiredUnstakeAmount: { type: new GraphQLNonNull(GraphQLBigNumber) },
  }
})

export const PartialUnstakeEvent = new GraphQLObjectType({
  name: 'PartialUnstakeEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.PartialUnstake,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(PartialUnstakeEventAccounts) },
    data: { type: new GraphQLNonNull(PartialUnstakeEventData) },
  },
})

export const MergeStakesEventAccounts = new GraphQLObjectType({
  name: 'MergeStakesEventAccounts',
  fields: {
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
  }
})

export const MergeStakesEventData = new GraphQLObjectType({
  name: 'MergeStakesEventData',
  fields: {
    destinationStakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    sourceStakeIndex: { type: new GraphQLNonNull(GraphQLInt) },
    validatorIndex: { type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const MergeStakesEvent = new GraphQLObjectType({
  name: 'MergeStakesEvent',
  interfaces: [Event],
  isTypeOf: (item) => item.type === InstructionType.MergeStakes,
  fields: {
    ...commonEventFields,
    accounts: { type: new GraphQLNonNull(MergeStakesEventAccounts) },
    data: { type: new GraphQLNonNull(MergeStakesEventData) },
  },
})

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
