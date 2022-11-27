/*********************************************
 | Type file generated with anchor-generator |
 *********************************************/

import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

import {
  addMappingStruct,
  addPriceStruct,
  addProductStruct,
  addPublisherStruct,
  aggPriceStruct,
  delPublisherStruct,
  initMappingStruct,
  initPriceStruct,
  resizeAccountStruct,
  setMinPubStruct,
  updPriceNoFailOnErrorStruct,
  updPriceStruct,
  updProductStruct,
} from '../solita/index.js'
import { PythEventType } from '../../types.js'

// ------------------- DATA LAYOUT -------------------
export const IX_DATA_LAYOUT: Partial<Record<PythEventType, any>> = {
  [PythEventType.InitMapping]: initMappingStruct,
  [PythEventType.AddMapping]: addMappingStruct,
  [PythEventType.AddProduct]: addProductStruct,
  [PythEventType.UpdProduct]: updProductStruct,
  [PythEventType.AddPrice]: addPriceStruct,
  [PythEventType.AddPublisher]: addPublisherStruct,
  [PythEventType.DelPublisher]: delPublisherStruct,
  [PythEventType.UpdPrice]: updPriceStruct,
  [PythEventType.AggPrice]: aggPriceStruct,
  [PythEventType.InitPrice]: initPriceStruct,
  [PythEventType.SetMinPub]: setMinPubStruct,
  [PythEventType.UpdPriceNoFailOnError]: updPriceNoFailOnErrorStruct,
  [PythEventType.ResizeAccount]: resizeAccountStruct,
}

// ------------------- ACCOUNT LAYOUT -------------------
export const IX_ACCOUNTS_LAYOUT: Partial<Record<PythEventType, any>> = {
  [PythEventType.InitMapping]: ['funding_account', 'fresh_mapping_account'],
  [PythEventType.AddMapping]: [
    'funding_account',
    'cur_mapping',
    'next_mapping',
  ],
  [PythEventType.AddProduct]: [
    'funding_account',
    'tail_mapping_account',
    'new_product_account',
  ],
  [PythEventType.UpdProduct]: ['funding_account', 'product_account'],
  [PythEventType.AddPrice]: [
    'funding_account',
    'product_account',
    'price_account',
  ],
  [PythEventType.AddPublisher]: ['funding_account', 'price_account'],
  [PythEventType.DelPublisher]: ['funding_account', 'price_account'],
  [PythEventType.UpdPrice]: [
    'funding_account',
    'price_account',
    'clock_account',
  ],
  [PythEventType.AggPrice]: [
    'funding_account',
    'price_account',
    'clock_account',
  ],
  [PythEventType.InitPrice]: ['funding_account', 'price_account'],
  [PythEventType.SetMinPub]: ['funding_account', 'price_account'],
  [PythEventType.UpdPriceNoFailOnError]: [
    'funding_account',
    'price_account',
    'clock_account',
  ],
  [PythEventType.ResizeAccount]: ['funding_account', 'price_account'],
}

// ------------------- INSTRUCTIONS -------------------
export type InitMappingInstruction = {
  accounts: {
    funding_accountAccount: string
    fresh_mapping_accountAccount: string
  }
}

export type AddMappingInstruction = {
  accounts: {
    funding_accountAccount: string
    cur_mappingAccount: string
    next_mappingAccount: string
  }
}

export type AddProductInstruction = {
  accounts: {
    funding_accountAccount: string
    tail_mapping_accountAccount: string
    new_product_accountAccount: string
  }
}

export type UpdProductInstruction = {
  new_data: Buffer
  accounts: {
    funding_accountAccount: string
    product_accountAccount: string
  }
}

export type AddPriceInstruction = {
  expo_: number
  ptype_: number
  accounts: {
    funding_accountAccount: string
    product_accountAccount: string
    price_accountAccount: string
  }
}

export type AddPublisherInstruction = {
  pub_: PublicKey
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
  }
}

export type DelPublisherInstruction = {
  pub_: PublicKey
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
  }
}

export type UpdPriceInstruction = {
  status_: number
  unused_: number
  price_: BN
  conf_: BN
  pub_slot_: BN
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
    clock_accountAccount: string
  }
}

export type AggPriceInstruction = {
  status_: number
  unused_: number
  price_: BN
  conf_: BN
  pub_slot_: BN
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
    clock_accountAccount: string
  }
}

export type InitPriceInstruction = {
  expo_: number
  ptype_: number
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
  }
}

export type SetMinPubInstruction = {
  min_pub_: number
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
  }
}

export type UpdPriceNoFailOnErrorInstruction = {
  status_: number
  unused_: number
  price_: BN
  conf_: BN
  pub_slot_: BN
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
    clock_accountAccount: string
  }
}

export type ResizeAccountInstruction = {
  accounts: {
    funding_accountAccount: string
    price_accountAccount: string
  }
}

export type ParsedPythInstruction =
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
