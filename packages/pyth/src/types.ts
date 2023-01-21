import { EventBase } from '@aleph-indexer/core'
import {
  PriceStatus,
  PriceData,
  Ema,
  PriceComponent,
  Product,
  Price as PythPrice,
} from '@pythnetwork/client'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  IdlField,
  IdlType,
  IdlAccountItem,
} from '@coral-xyz/anchor/dist/cjs/idl'
// ------------------- ACCOUNTS -------------------
export enum AccountsType {
  PriceAccount = 'PriceAccount',
  ProductAccount = 'ProductAccount',
}

export type PythAccountInfo = {
  name: string
  programId: string
  address: string
  type: AccountsType
  data: ParsedAccountsData
}

export type ProductDataWithoutHeader = {
  priceAccountKey: PublicKey
  product: Product
}

export type EmaBN = Omit<
  Ema,
  'valueComponent' | 'numerator' | 'denominator'
> & {
  valueComponent: BN
  numerator: BN
  denominator: BN
}

export type PriceComponentBN = Omit<
  PriceComponent,
  'publisher' | 'aggregate' | 'latest'
> & {
  publisher: PublicKey | null
  aggregate: PriceBN
  latest: PriceBN
}

export type PriceBN = Omit<
  PythPrice,
  'priceComponent' | 'confidenceComponent'
> & {
  priceComponent: BN
  confidenceComponent: BN
}

export type PriceDataBN = Omit<
  PriceData,
  | 'lastSlot'
  | 'validSlot'
  | 'emaPrice'
  | 'emaConfidence'
  | 'timestamp'
  | 'previousSlot'
  | 'previousPriceComponent'
  | 'previousConfidenceComponent'
  | 'previousTimestamp'
  | 'priceComponents'
  | 'aggregate'
> & {
  lastSlot: BN
  validSlot: BN
  emaPrice: EmaBN
  emaConfidence: EmaBN
  timestamp: BN
  previousSlot: BN
  previousPriceComponent: BN
  previousConfidenceComponent: BN
  previousTimestamp: BN
  priceComponents: PriceComponentBN[]
  aggregate: PriceBN
}

export type ParsedAccountsData = ProductDataWithoutHeader & PriceDataBN

export type Price = {
  id: string
  timestamp: number
  priceAccount: string
  price: number
  confidence: number
  status: PriceStatus
}

// ------------------- INSTRUCTIONS -------------------
export type IxAccounts = {
  fundingAccount: string
  productAccount: string
  priceAccount: string
}

export type UpdPriceInstruction = {
  status: number
  unused: number
  price: number
  conf: number
  pubSlot: number
  accounts: IxAccounts
}

export type AggPriceInstruction = {
  status: number
  unused: number
  price: number
  conf: number
  pubSlot: number
  accounts: IxAccounts
}

export type UpdPriceNoFailOnErrorInstruction = {
  status: number
  unused: number
  price: number
  conf: number
  pubSlot: number
  accounts: IxAccounts
}

// @note: https://github.com/pyth-network/pyth-client/blob/idl/program/idl.json
export enum PythEventType {
  UpdPrice = 'updPrice',
  AggPrice = 'aggPrice',
  UpdPriceNoFailOnError = 'updPriceNoFailOnError',
}

export type IxEventInfo = {
  status: number
  unused: number
  price: BN
  conf: BN
  pubSlot: BN
}

export type ParsedEventsInfo =
  | UpdPriceInstruction
  | AggPriceInstruction
  | UpdPriceNoFailOnErrorInstruction

/**
 * @note: Exclude not significant events from being indexed
 * */

export type PythEventBase = EventBase<PythEventType>

export type PythEvent = PythEventBase &
  (UpdPriceInstruction | AggPriceInstruction | UpdPriceNoFailOnErrorInstruction)

// @note: The only significant event is the price update
export type UpdatePriceEvent = PythEventBase &
  UpdPriceInstruction & {
    type: PythEventType.UpdPrice
  }

export type AggregatePriceEvent = PythEventBase &
  AggPriceInstruction & {
    type: PythEventType.AggPrice
  }

export type UpdatePriceNoFailOnErrorEvent = PythEventBase &
  UpdPriceNoFailOnErrorInstruction & {
    type: PythEventType.UpdPriceNoFailOnError
  }

// -------------- STATS -------------------

export type CandleInterval =
  | 'minute1'
  | 'minute5'
  | 'minute10'
  | 'minute15'
  | 'minute30'
  | 'hour1'
  | 'hour2'
  | 'hour3'
  | 'hour4'
  | 'hour6'
  | 'hour8'
  | 'hour12'
  | 'day1'
  | 'week1'
  | 'week2'
  | 'month1'
  | 'month3'
  | 'year1'
  | 'all'

export type PythAccountStats = {
  last1h: Candle
  last24h: Candle
  last7d: Candle
  lastMonth: Candle
  YTD: Candle
  lastYear: Candle
  total: Candle

  markPrice: number
  confidence: number
}

export type Candle = {
  openPrice: number
  highPrice: number
  lowPrice: number
  closePrice: number
  openConfidence: number
  // @note: confidence of the high price
  highConfidence: number
  // @note: confidence of the low price
  lowConfidence: number
  closeConfidence: number
  openTimestamp: number
  highTimestamp: number
  lowTimestamp: number
  closeTimestamp: number
}

export type GlobalPythStats = {
  totalDataFeeds: number
  totalCryptoDataFeeds: number
  totalEquityDataFeeds: number
  totalFXDataFeeds: number
  totalMetalDataFeeds: number
}

export type PythAccountData = {
  info: PythAccountInfo
  stats?: PythAccountStats
}

// ------------------- IDL -------------------
export type PythIdlInstruction = {
  name: string
  docs?: string[]
  accounts: IdlAccountItem[]
  args: IdlField[]
  returns?: IdlType
  discriminant: IdlDiscriminant
}

export type IdlDiscriminant = {
  value: number[]
}

export type PythOracle = {
  version: '2.20.0'
  name: 'pyth_oracle'
  instructions: [
    {
      name: 'initMapping'
      discriminant: { value: [2, 0, 0, 0, 0, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'freshMappingAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: []
    },
    {
      name: 'addMapping'
      discriminant: { value: [2, 0, 0, 0, 1, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'curMapping'
          isMut: true
          isSigner: false
        },
        {
          name: 'nextMapping'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: []
    },
    {
      name: 'addProduct'
      discriminant: { value: [2, 0, 0, 0, 2, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'tailMappingAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'productAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: []
    },
    {
      name: 'updProduct'
      discriminant: { value: [2, 0, 0, 0, 3, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'productAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'productMetadata'
          type: {
            defined: 'ProductMetadata'
          }
        },
      ]
    },
    {
      name: 'addPrice'
      discriminant: { value: [2, 0, 0, 0, 4, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'productAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'expo'
          type: 'i32'
        },
        {
          name: 'pType'
          type: 'u32'
        },
      ]
    },
    {
      name: 'addPublisher'
      discriminant: { value: [2, 0, 0, 0, 5, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'pub'
          type: 'publicKey'
        },
      ]
    },
    {
      name: 'delPublisher'
      discriminant: { value: [2, 0, 0, 0, 6, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'pub'
          type: 'publicKey'
        },
      ]
    },
    {
      name: 'updPrice'
      discriminant: { value: [2, 0, 0, 0, 7, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'clock'
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: 'status'
          type: 'u32'
        },
        {
          name: 'unused'
          type: 'u32'
        },
        {
          name: 'price'
          type: 'i64'
        },
        {
          name: 'conf'
          type: 'u64'
        },
        {
          name: 'pubSlot'
          type: 'u64'
        },
      ]
    },
    {
      name: 'aggPrice'
      discriminant: { value: [2, 0, 0, 0, 8, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'clock'
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: 'status'
          type: 'u32'
        },
        {
          name: 'unused'
          type: 'u32'
        },
        {
          name: 'price'
          type: 'i64'
        },
        {
          name: 'conf'
          type: 'u64'
        },
        {
          name: 'pubSlot'
          type: 'u64'
        },
      ]
    },
    {
      name: 'initPrice'
      discriminant: { value: [2, 0, 0, 0, 9, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'expo'
          type: 'i32'
        },
        {
          name: 'pType'
          type: 'u32'
        },
      ]
    },
    {
      name: 'setMinPub'
      discriminant: { value: [2, 0, 0, 0, 12, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: [
        {
          name: 'minPub'
          type: 'u8'
        },
        {
          name: 'unused'
          type: {
            array: ['u8', 3]
          }
        },
      ]
    },
    {
      name: 'updPriceNoFailOnError'
      discriminant: { value: [2, 0, 0, 0, 13, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'clock'
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: 'status'
          type: 'u32'
        },
        {
          name: 'unused'
          type: 'u32'
        },
        {
          name: 'price'
          type: 'i64'
        },
        {
          name: 'conf'
          type: 'u64'
        },
        {
          name: 'pubSlot'
          type: 'u64'
        },
      ]
    },
    {
      name: 'delPrice'
      discriminant: { value: [2, 0, 0, 0, 15, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'productAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'priceAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: []
    },
    {
      name: 'delProduct'
      discriminant: { value: [2, 0, 0, 0, 16, 0, 0, 0] }
      accounts: [
        {
          name: 'fundingAccount'
          isMut: true
          isSigner: true
        },
        {
          name: 'mappingAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'productAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: false
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
      ]
      args: []
    },
    {
      name: 'updPermissions'
      discriminant: { value: [2, 0, 0, 0, 17, 0, 0, 0] }
      accounts: [
        {
          name: 'upgradeAuthority'
          isMut: true
          isSigner: true
        },
        {
          name: 'programDataAccount'
          isMut: false
          isSigner: false
        },
        {
          name: 'permissionsAccount'
          isMut: true
          isSigner: false
          pda: {
            seeds: [
              {
                kind: 'const'
                type: 'string'
                value: 'permissions'
              },
            ]
          }
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        },
      ]
      args: [
        {
          name: 'masterAuthority'
          type: 'publicKey'
        },
        {
          name: 'dataCurationAuthority'
          type: 'publicKey'
        },
        {
          name: 'securityAuthority'
          type: 'publicKey'
        },
      ]
    },
  ]
  types: [
    {
      name: 'ProductMetadata'
      type: {
        kind: 'struct'
        fields: []
      }
    },
  ]
}
