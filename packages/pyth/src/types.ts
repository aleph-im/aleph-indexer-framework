import { EventBase } from '@aleph-indexer/core'
import {
  AddMappingInstruction,
  AddPriceInstruction,
  AddProductInstruction,
  AddPublisherInstruction,
  AggPriceInstruction,
  DelPublisherInstruction,
  InitMappingInstruction,
  InitPriceInstruction,
  ResizeAccountInstruction,
  SetMinPubInstruction,
  UpdPriceInstruction,
  UpdPriceNoFailOnErrorInstruction,
  UpdProductInstruction,
} from './layouts/ts/instructions.js'
import { PriceStatus, ProductData, PriceData, Base } from '@pythnetwork/client'
import { AccountsType } from './layouts/accounts.js'

export type PythAccountInfo = {
  name: string
  programId: string
  address: string
  type: AccountsType
  data: ParsedAccountsData
}

export type ParsedAccountsData = Base & SpecificData

type SpecificData = ProductData | PriceData

export {
  ParsedPythInstruction,
  InitMappingInstruction,
  AddMappingInstruction,
  AddProductInstruction,
  UpdProductInstruction,
  AddPriceInstruction,
  AddPublisherInstruction,
  DelPublisherInstruction,
  UpdPriceInstruction,
  AggPriceInstruction,
  InitPriceInstruction,
  SetMinPubInstruction,
  UpdPriceNoFailOnErrorInstruction,
  ResizeAccountInstruction,
} from './layouts/ts/instructions.js'

export type Price = {
  id: string
  timestamp: number
  priceAccount: string
  price: number
  confidence: number
  status: PriceStatus
}

// @note: https://github.com/pyth-network/pyth-client/blob/idl/program/idl.json
export enum PythEventType {
  InitMapping = 'initMapping',
  AddMapping = 'addMapping',
  AddProduct = 'addProduct',
  UpdProduct = 'updProduct',
  AddPrice = 'addPrice',
  AddPublisher = 'addPublisher',
  DelPublisher = 'delPublisher',
  UpdPrice = 'updPrice',
  AggPrice = 'aggPrice',
  InitPrice = 'initPrice',
  SetMinPub = 'setMinPub',
  UpdPriceNoFailOnError = 'updPriceNoFailOnError',
  ResizeAccount = 'resizeAccount',
}

/**
 * @note: Exclude not significant events from being indexed
 * */

export type PythEventBase = EventBase<PythEventType>

export type PythEvent = PythEventBase &
  (
    | InitMappingInstruction
    | AddMappingInstruction
    | AddProductInstruction
    | UpdProductInstruction
    | AddPriceInstruction
    | AddPublisherInstruction
    | DelPublisherInstruction
    | UpdPriceInstruction
    | AggPriceInstruction
    | InitPriceInstruction
    | SetMinPubInstruction
    | UpdPriceNoFailOnErrorInstruction
    | ResizeAccountInstruction
  )

// @note: The only significant event is the price update
export type UpdatePriceEvent = PythEventBase &
  UpdPriceInstruction & {
    type: PythEventType.UpdPrice
  }

export type InitMappingEvent = PythEventBase &
  InitMappingInstruction & {
    type: PythEventType.InitMapping
  }

export type AddMappingEvent = PythEventBase &
  AddMappingInstruction & {
    type: PythEventType.AddMapping
  }

export type AddProductEvent = PythEventBase &
  AddProductInstruction & {
    type: PythEventType.AddProduct
  }

export type UpdateProductEvent = PythEventBase &
  UpdProductInstruction & {
    type: PythEventType.UpdProduct
  }

export type AddPriceEvent = PythEventBase &
  AddPriceInstruction & {
    type: PythEventType.AddPrice
  }

export type AddPublisherEvent = PythEventBase &
  AddPublisherInstruction & {
    type: PythEventType.AddPublisher
  }

export type DeletePublisherEvent = PythEventBase &
  DelPublisherInstruction & {
    type: PythEventType.DelPublisher
  }

export type AggregatePriceEvent = PythEventBase &
  AggPriceInstruction & {
    type: PythEventType.AggPrice
  }

export type InitPriceEvent = PythEventBase &
  InitPriceInstruction & {
    type: PythEventType.InitPrice
  }

export type SetMinPublishersEvent = PythEventBase &
  SetMinPubInstruction & {
    type: PythEventType.SetMinPub
  }

export type UpdatePriceNoFailOnErrorEvent = PythEventBase &
  UpdPriceNoFailOnErrorInstruction & {
    type: PythEventType.UpdPriceNoFailOnError
  }

export type ResizeAccountEvent = PythEventBase &
  ResizeAccountInstruction & {
    type: PythEventType.ResizeAccount
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
