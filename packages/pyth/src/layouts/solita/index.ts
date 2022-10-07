export * from './instructions/index.js'

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
