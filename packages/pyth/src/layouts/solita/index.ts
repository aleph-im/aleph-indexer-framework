export * from './accounts/index.js'
export * from './instructions/index.js'
export * from './types/index.js'
import {
  PriceAccount,
  PriceAccountArgs,
  ProductAccount,
  ProductAccountArgs,
} from './accounts/index.js'

import {
  AccountHeader,
  PriceEma,
  PriceInfo,
  PriceComponent,
} from './types/index.js'
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
} from './instructions/index.js'

export type ParsedInstructions =
  | AddMappingInstruction
  | AddPriceInstruction
  | AddProductInstruction
  | AddPublisherInstruction
  | AggPriceInstruction
  | DelPublisherInstruction
  | InitMappingInstruction
  | InitPriceInstruction
  | ResizeAccountInstruction
  | SetMinPubInstruction
  | UpdPriceInstruction
  | UpdPriceNoFailOnErrorInstruction
  | UpdProductInstruction

export type ParsedAccounts = PriceAccount | ProductAccount

export type ParsedAccountsData = PriceAccountArgs | ProductAccountArgs

export type ParsedTypes = AccountHeader | PriceEma | PriceInfo | PriceComponent
