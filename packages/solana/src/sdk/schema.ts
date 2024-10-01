import {
  type as pick,
  number,
  string,
  array,
  boolean,
  literal,
  union,
  optional,
  nullable,
  coerce,
  unknown,
  tuple,
} from 'superstruct'

const AddressTableLookupStruct = pick({
  accountKey: string(),
  writableIndexes: array(number()),
  readonlyIndexes: array(number()),
})

const LoadedAddressesResult = pick({
  writable: array(string()),
  readonly: array(string()),
})

const TokenAmountResult = pick({
  amount: string(),
  uiAmount: nullable(number()),
  decimals: number(),
  uiAmountString: optional(string()),
})

const TokenBalanceResult = pick({
  accountIndex: number(),
  mint: string(),
  owner: optional(string()),
  uiTokenAmount: TokenAmountResult,
})

const TransactionErrorResult = nullable(union([pick({}), string()]))

const RawInstructionResult = pick({
  accounts: array(string()),
  data: string(),
  programId: string(),
})

const ParsedInstructionResult = pick({
  parsed: unknown(),
  program: string(),
  programId: string(),
})

const InstructionResult = union([RawInstructionResult, ParsedInstructionResult])

const UnknownInstructionResult = union([
  pick({
    parsed: unknown(),
    program: string(),
    programId: string(),
  }),
  pick({
    accounts: array(string()),
    data: string(),
    programId: string(),
  }),
])

const ParsedOrRawInstruction = coerce(
  InstructionResult,
  UnknownInstructionResult,
  (value) => {
    if ('accounts' in value) {
      RawInstructionResult
    } else {
      ParsedInstructionResult
    }
  },
)

const ParsedConfirmedTransactionResult = pick({
  signatures: array(string()),
  message: pick({
    accountKeys: array(
      pick({
        pubkey: string(),
        signer: boolean(),
        writable: boolean(),
        source: optional(
          union([literal('transaction'), literal('lookupTable')]),
        ),
      }),
    ),
    instructions: array(ParsedOrRawInstruction),
    recentBlockhash: string(),
    addressTableLookups: optional(nullable(array(AddressTableLookupStruct))),
  }),
})

const TransactionVersionStruct = union([literal(0), literal('legacy')])

const ParsedConfirmedTransactionMetaResult = pick({
  err: TransactionErrorResult,
  fee: number(),
  innerInstructions: optional(
    nullable(
      array(
        pick({
          index: number(),
          instructions: array(ParsedOrRawInstruction),
        }),
      ),
    ),
  ),
  preBalances: array(number()),
  postBalances: array(number()),
  logMessages: optional(nullable(array(string()))),
  preTokenBalances: optional(nullable(array(TokenBalanceResult))),
  postTokenBalances: optional(nullable(array(TokenBalanceResult))),
  loadedAddresses: optional(LoadedAddressesResult),
  computeUnitsConsumed: optional(number()),
})

const VoteAccountInfoResult = pick({
  votePubkey: string(),
  nodePubkey: string(),
  activatedStake: number(),
  epochVoteAccount: boolean(),
  epochCredits: array(tuple([number(), number(), number()])),
  commission: number(),
  lastVote: number(),
  rootSlot: nullable(number()),
})

const SupplyContext = pick({
  apiVersion: string(),
  slot: number(),
})

const SupplyValue = pick({
  total: number(),
  circulating: number(),
  nonCirculating: number(),
  nonCirculatingAccounts: array(string()),
})

/**
 * Expected JSON RPC response for the "getSupply" message
 */
export const GetSupplyRpcResult = pick({
  context: SupplyContext,
  value: SupplyValue,
})

/**
 * Expected JSON RPC response for the "getSignaturesForAddress" message
 */
export const GetSignaturesForAddressRpcResult = array(
  pick({
    signature: string(),
    slot: number(),
    err: TransactionErrorResult,
    memo: nullable(string()),
    blockTime: optional(nullable(number())),
  }),
)

/**
 * Expected JSON RPC response for the "getTransaction" message
 */
export const GetParsedTransactionRpcResult = nullable(
  pick({
    slot: number(),
    transaction: ParsedConfirmedTransactionResult,
    meta: nullable(ParsedConfirmedTransactionMetaResult),
    blockTime: optional(nullable(number())),
    version: optional(TransactionVersionStruct),
  }),
)

/**
 * Expected JSON RPC response for the "getVoteAccounts" message
 */
export const GetVoteAccounts = pick({
  current: array(VoteAccountInfoResult),
  delinquent: array(VoteAccountInfoResult),
})
