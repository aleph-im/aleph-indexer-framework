import { ErrorCatalog } from '../types/index.js'
import { sleep, BackoffFunction, linealBackoff } from './time.js'

export interface TryAndRetryOpts {
  attemps: number
  t?: number
  errorFilter?: (e: Error) => boolean
  backoffFn?: BackoffFunction
}

export async function tryAndRetry<T>(
  fn: (...args: any) => Promise<T>,
  {
    attemps = 1,
    t = 0,
    errorFilter,
    backoffFn = linealBackoff(),
  }: TryAndRetryOpts = {} as any,
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (t >= attemps) throw e
    if (errorFilter && errorFilter(e as Error)) throw e

    await sleep(backoffFn(t))

    return tryAndRetry(fn, {
      attemps,
      t: t + 1,
      backoffFn,
      errorFilter,
    })
  }
}

export function notImplemented(): void {
  throw new Error('Method not implemented.')
}

// @note: Taken from: https://github.com/solana-labs/solana/blob/master/sdk/src/transaction/error.rs#L13
export enum TransactionErrorType {
  AccountInUse,
  AccountLoadedTwice,
  AccountNotFound,
  ProgramAccountNotFound,
  InsufficientFundsForFee,
  InvalidAccountForFee,
  AlreadyProcessed,
  BlockhashNotFound,
  InstructionError,
  CallChainTooDeep,
  MissingSignatureForFee,
  InvalidAccountIndex,
  SignatureFailure,
  InvalidProgramForExecution,
  SanitizeFailure,
  ClusterMaintenance,
  AccountBorrowOutstanding,
  WouldExceedMaxBlockCostLimit,
  UnsupportedVersion,
  InvalidWritableAccount,
  WouldExceedMaxAccountCostLimit,
  WouldExceedMaxAccountDataCostLimit,
  TooManyAccountLocks,
  AddressLookupTableNotFound,
  InvalidAddressLookupTableOwner,
  InvalidAddressLookupTableData,
  InvalidAddressLookupTableIndex,
  InvalidRentPayingAccount,
  WouldExceedMaxVoteCostLimit,
}

// @note: Taken from: https://github.com/solana-labs/solana/blob/master/sdk/program/src/program_error.rs#L12
export enum ProgramErrorType {
  Custom,
  InvalidArgument,
  InvalidInstructionData,
  InvalidAccountData,
  AccountDataTooSmall,
  InsufficientFunds,
  IncorrectProgramId,
  MissingRequiredSignature,
  AccountAlreadyInitialized,
  UninitializedAccount,
  NotEnoughAccountKeys,
  AccountBorrowFailed,
  MaxSeedLengthExceeded,
  InvalidSeeds,
  BorshIoError,
  AccountNotRentExempt,
  UnsupportedSysvar,
  IllegalOwner,
  AccountsDataBudgetExceeded,
  ActiveVoteAccountClose,
}

export const transactionErrorCatalog: ErrorCatalog = [
  {
    code: TransactionErrorType.AccountInUse,
    name: 'AccountInUse',
    msg: 'Account in use',
  },
  {
    code: TransactionErrorType.AccountLoadedTwice,
    name: 'AccountLoadedTwice',
    msg: 'Account loaded twice',
  },
  {
    code: TransactionErrorType.AccountNotFound,
    name: 'AccountNotFound',
    msg: 'Attempt to debit an account but found no record of a prior credit.',
  },
  {
    code: TransactionErrorType.ProgramAccountNotFound,
    name: 'ProgramAccountNotFound',
    msg: 'Attempt to load a program that does not exist',
  },
  {
    code: TransactionErrorType.InsufficientFundsForFee,
    name: 'InsufficientFundsForFee',
    msg: 'Insufficient funds for fee',
  },
  {
    code: TransactionErrorType.InvalidAccountForFee,
    name: 'InvalidAccountForFee',
    msg: 'This account may not be used to pay transaction fees',
  },
  {
    code: TransactionErrorType.AlreadyProcessed,
    name: 'AlreadyProcessed',
    msg: 'This transaction has already been processed',
  },
  {
    code: TransactionErrorType.BlockhashNotFound,
    name: 'BlockhashNotFound',
    msg: 'Blockhash not found',
  },
  {
    code: TransactionErrorType.InstructionError,
    name: 'InstructionError',
    msg: 'Error processing Instruction {0}: {1}',
  },
  {
    code: TransactionErrorType.CallChainTooDeep,
    name: 'CallChainTooDeep',
    msg: 'Loader call chain is too deep',
  },
  {
    code: TransactionErrorType.MissingSignatureForFee,
    name: 'MissingSignatureForFee',
    msg: 'Transaction requires a fee but has no signature present',
  },
  {
    code: TransactionErrorType.InvalidAccountIndex,
    name: 'InvalidAccountIndex',
    msg: 'Transaction contains an invalid account reference',
  },
  {
    code: TransactionErrorType.SignatureFailure,
    name: 'SignatureFailure',
    msg: 'Transaction did not pass signature verification',
  },
  {
    code: TransactionErrorType.InvalidProgramForExecution,
    name: 'InvalidProgramForExecution',
    msg: 'This program may not be used for executing instructions',
  },
  {
    code: TransactionErrorType.SanitizeFailure,
    name: 'SanitizeFailure',
    msg: 'Transaction failed to sanitize accounts offsets correctly',
  },
  {
    code: TransactionErrorType.ClusterMaintenance,
    name: 'ClusterMaintenance',
    msg: 'Transactions are currently disabled due to cluster maintenance',
  },
  {
    code: TransactionErrorType.AccountBorrowOutstanding,
    name: 'AccountBorrowOutstanding',
    msg: 'Transaction processing left an account with an outstanding borrowed reference',
  },
  {
    code: TransactionErrorType.WouldExceedMaxBlockCostLimit,
    name: 'WouldExceedMaxBlockCostLimit',
    msg: 'Transaction would exceed max Block Cost Limit',
  },
  {
    code: TransactionErrorType.UnsupportedVersion,
    name: 'UnsupportedVersion',
    msg: 'Transaction version is unsupported',
  },
  {
    code: TransactionErrorType.InvalidWritableAccount,
    name: 'InvalidWritableAccount',
    msg: 'Transaction loads a writable account that cannot be written',
  },
  {
    code: TransactionErrorType.WouldExceedMaxAccountCostLimit,
    name: 'WouldExceedMaxAccountCostLimit',
    msg: 'Transaction would exceed max account limit within the block',
  },
  {
    code: TransactionErrorType.WouldExceedMaxAccountDataCostLimit,
    name: 'WouldExceedMaxAccountDataCostLimit',
    msg: 'Transaction would exceed max account data limit within the block',
  },
  {
    code: TransactionErrorType.TooManyAccountLocks,
    name: 'TooManyAccountLocks',
    msg: 'Transaction locked too many accounts',
  },
  {
    code: TransactionErrorType.AddressLookupTableNotFound,
    name: 'AddressLookupTableNotFound',
    msg: "Transaction loads an address table account that doesn't exist",
  },
  {
    code: TransactionErrorType.InvalidAddressLookupTableOwner,
    name: 'InvalidAddressLookupTableOwner',
    msg: 'Transaction loads an address table account with an invalid owner',
  },
  {
    code: TransactionErrorType.InvalidAddressLookupTableData,
    name: 'InvalidAddressLookupTableData',
    msg: 'Transaction loads an address table account with invalid data',
  },
  {
    code: TransactionErrorType.InvalidAddressLookupTableIndex,
    name: 'InvalidAddressLookupTableIndex',
    msg: 'Transaction address table lookup uses an invalid index',
  },
  {
    code: TransactionErrorType.InvalidRentPayingAccount,
    name: 'InvalidRentPayingAccount',
    msg: 'Transaction leaves an account with data with a lower balance than rent-exempt minimum',
  },
  {
    code: TransactionErrorType.WouldExceedMaxVoteCostLimit,
    name: 'WouldExceedMaxVoteCostLimit',
    msg: 'Transaction would exceed max Vote Cost Limit',
  },
]

export const programErrorCatalog: ErrorCatalog = [
  {
    code: ProgramErrorType.Custom,
    name: 'Custom',
    msg: 'Custom program error: {0:#x}',
  },
  {
    code: ProgramErrorType.InvalidArgument,
    name: 'InvalidArgument',
    msg: 'The arguments provided to a program instruction where invalid',
  },
  {
    code: ProgramErrorType.InvalidInstructionData,
    name: 'InvalidInstructionData',
    msg: "An instruction's data contents was invalid",
  },
  {
    code: ProgramErrorType.InvalidAccountData,
    name: 'InvalidAccountData',
    msg: "An account's data contents was invalid",
  },
  {
    code: ProgramErrorType.AccountDataTooSmall,
    name: 'AccountDataTooSmall',
    msg: "An account's data was too small",
  },
  {
    code: ProgramErrorType.InsufficientFunds,
    name: 'InsufficientFunds',
    msg: "An account's balance was too small to complete the instruction",
  },
  {
    code: ProgramErrorType.IncorrectProgramId,
    name: 'IncorrectProgramId',
    msg: 'The account did not have the expected program id',
  },
  {
    code: ProgramErrorType.MissingRequiredSignature,
    name: 'MissingRequiredSignature',
    msg: 'A signature was required but not found',
  },
  {
    code: ProgramErrorType.AccountAlreadyInitialized,
    name: 'AccountAlreadyInitialized',
    msg: 'An initialize instruction was sent to an account that has already been initialized',
  },
  {
    code: ProgramErrorType.UninitializedAccount,
    name: 'UninitializedAccount',
    msg: "An attempt to operate on an account that hasn't been initialized",
  },
  {
    code: ProgramErrorType.NotEnoughAccountKeys,
    name: 'NotEnoughAccountKeys',
    msg: 'The instruction expected additional account keys',
  },
  {
    code: ProgramErrorType.AccountBorrowFailed,
    name: 'AccountBorrowFailed',
    msg: 'Failed to borrow a reference to account data, already borrowed',
  },
  {
    code: ProgramErrorType.MaxSeedLengthExceeded,
    name: 'MaxSeedLengthExceeded',
    msg: 'Length of the seed is too long for address generation',
  },
  {
    code: ProgramErrorType.InvalidSeeds,
    name: 'InvalidSeeds',
    msg: 'Provided seeds do not result in a valid address',
  },
  {
    code: ProgramErrorType.BorshIoError,
    name: 'BorshIoError',
    msg: 'IO Error: {0}',
  },
  {
    code: ProgramErrorType.AccountNotRentExempt,
    name: 'AccountNotRentExempt',
    msg: 'An account does not have enough lamports to be rent-exempt',
  },
  {
    code: ProgramErrorType.UnsupportedSysvar,
    name: 'UnsupportedSysvar',
    msg: 'Unsupported sysvar',
  },
  {
    code: ProgramErrorType.IllegalOwner,
    name: 'IllegalOwner',
    msg: 'Provided owner is not allowed',
  },
  {
    code: ProgramErrorType.AccountsDataBudgetExceeded,
    name: 'AccountsDataBudgetExceeded',
    msg: 'Requested account data allocation exceeded the accounts data budget',
  },
  {
    code: ProgramErrorType.ActiveVoteAccountClose,
    name: 'ActiveVoteAccountClose',
    msg: 'Cannot close vote account unless it stopped voting at least one full epoch ago',
  },
]
