import { PythEventType, PythOracle } from '../types.js'
import { IdlCoder } from './idlCoder.js'
import idl from '../idl.json' assert { type: 'json' }
import { Layout } from '@aleph-indexer/layout'

const idlCoder = new IdlCoder(idl as PythOracle)

export function getPythEventType(ix: Buffer): PythEventType | undefined {
  const discriminator = ix.subarray(0, idlCoder.discriminatorLength)
  return IX_METHOD_CODE.get(discriminator)
}

export const IX_METHOD_CODE: Map<Buffer | undefined, PythEventType> = new Map<
  Buffer | undefined,
  PythEventType
>([
  [idlCoder.ixDiscriminator.get('initMapping'), PythEventType.InitMapping],
  [idlCoder.ixDiscriminator.get('addMapping'), PythEventType.AddMapping],
  [idlCoder.ixDiscriminator.get('addProduct'), PythEventType.AddProduct],
  [idlCoder.ixDiscriminator.get('updProduct'), PythEventType.UpdProduct],
  [idlCoder.ixDiscriminator.get('addPrice'), PythEventType.AddPrice],
  [idlCoder.ixDiscriminator.get('addPublisher'), PythEventType.AddPublisher],
  [idlCoder.ixDiscriminator.get('delPublisher'), PythEventType.DelPublisher],
  [idlCoder.ixDiscriminator.get('updPrice'), PythEventType.UpdPrice],
  [idlCoder.ixDiscriminator.get('aggPrice'), PythEventType.AggPrice],
  [idlCoder.ixDiscriminator.get('initPrice'), PythEventType.InitPrice],
  [idlCoder.ixDiscriminator.get('setMinPub'), PythEventType.SetMinPub],
  [
    idlCoder.ixDiscriminator.get('updPriceNoFailOnError'),
    PythEventType.UpdPriceNoFailOnError,
  ],
  [idlCoder.ixDiscriminator.get('resizeAccount'), PythEventType.ResizeAccount],
])

// ------------------- IX DATA LAYOUT -------------------
export const IX_DATA_LAYOUT: Partial<Record<PythEventType, Layout>> = {
  [PythEventType.InitMapping]: idlCoder.ixLayout.get('initMapping'),
  [PythEventType.AddMapping]: idlCoder.ixLayout.get('addMapping'),
  [PythEventType.AddProduct]: idlCoder.ixLayout.get('addProduct'),
  [PythEventType.UpdProduct]: idlCoder.ixLayout.get('updProduct'),
  [PythEventType.AddPrice]: idlCoder.ixLayout.get('addPrice'),
  [PythEventType.AddPublisher]: idlCoder.ixLayout.get('addPublisher'),
  [PythEventType.DelPublisher]: idlCoder.ixLayout.get('delPublisher'),
  [PythEventType.UpdPrice]: idlCoder.ixLayout.get('updPrice'),
  [PythEventType.AggPrice]: idlCoder.ixLayout.get('aggPrice'),
  [PythEventType.InitPrice]: idlCoder.ixLayout.get('initPrice'),
  [PythEventType.SetMinPub]: idlCoder.ixLayout.get('setMinPub'),
  [PythEventType.UpdPriceNoFailOnError]: idlCoder.ixLayout.get(
    'updPriceNoFailOnError',
  ),
  [PythEventType.ResizeAccount]: idlCoder.ixLayout.get('resizeAccount'),
}

// ------------------- ACCOUNT LAYOUT -------------------
export const IX_ACCOUNTS_LAYOUT: Partial<Record<PythEventType, string[]>> = {
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
