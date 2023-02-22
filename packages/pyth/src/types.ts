import { EventBase } from '@aleph-indexer/framework'
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

// @note: https://github.com/pyth-network/pyth-client/blob/idl/program/idl.json
export enum PythEventType {
  UpdPrice = 'updPrice',
  AggPrice = 'aggPrice',
  UpdPriceNoFailOnError = 'updPriceNoFailOnError',
}

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

export type PythEventInfo =
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
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year'
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