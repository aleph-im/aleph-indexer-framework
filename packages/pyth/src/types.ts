import { EventBase } from '@aleph-indexer/core'
import { ProductData } from './utils/pyth-sdk.js'
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

import { PriceStatus } from '@pythnetwork/client'

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

// -------------- DATA FEED INFO -------------------
export type DataFeedInfo = ProductData & {
  address: string
}

// -------------- STATS -------------------

export type CandleInterval =
  | '1minute'
  | '5minute'
  | '10minute'
  | '15minute'
  | '30minute'
  | '1hour'
  | '2hour'
  | '3hour'
  | '4hour'
  | '6hour'
  | '8hour'
  | '12hour'
  | '1day'
  | '1week'
  | '2week'
  | '1month'
  | '3month'
  | '1year'
  | 'all'

export type DataFeedStats = {
  last1h: Candle
  last24h: Candle
  last7d: Candle
  last1m: Candle
  lastYear: Candle
  total: Candle

  markPrice: number
  confidence: number
}

export type DataFeedStatsWithAddress = DataFeedStats & {
  address: string
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

export type DataFeedData = {
  info: DataFeedInfo
  stats?: DataFeedStats
}
