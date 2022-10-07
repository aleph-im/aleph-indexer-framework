import {
  addMappingInstructionDiscriminator,
  addPriceInstructionDiscriminator,
  addProductInstructionDiscriminator,
  addPublisherInstructionDiscriminator,
  aggPriceInstructionDiscriminator,
  delPublisherInstructionDiscriminator,
  initMappingInstructionDiscriminator,
  initPriceInstructionDiscriminator,
  resizeAccountInstructionDiscriminator,
  setMinPubInstructionDiscriminator,
  updPriceInstructionDiscriminator,
  updPriceNoFailOnErrorInstructionDiscriminator,
  updProductInstructionDiscriminator,
} from './solita/index.js'
import { PythEventType } from '../types.js'

export { IX_DATA_LAYOUT, IX_ACCOUNTS_LAYOUT } from './ts/instructions.js'

export function getPythEventType(data: Buffer): PythEventType | undefined {
  const discriminator = data.slice(0, 8)
  return IX_METHOD_CODE.get(discriminator.toString('ascii'))
}

export const IX_METHOD_CODE: Map<string, PythEventType | undefined> = new Map<
  string,
  PythEventType | undefined
>([
  [
    Buffer.from(initMappingInstructionDiscriminator).toString('ascii'),
    PythEventType.InitMapping,
  ],
  [
    Buffer.from(addMappingInstructionDiscriminator).toString('ascii'),
    PythEventType.AddMapping,
  ],
  [
    Buffer.from(addProductInstructionDiscriminator).toString('ascii'),
    PythEventType.AddProduct,
  ],
  [
    Buffer.from(updProductInstructionDiscriminator).toString('ascii'),
    PythEventType.UpdProduct,
  ],
  [
    Buffer.from(addPriceInstructionDiscriminator).toString('ascii'),
    PythEventType.AddPrice,
  ],
  [
    Buffer.from(addPublisherInstructionDiscriminator).toString('ascii'),
    PythEventType.AddPublisher,
  ],
  [
    Buffer.from(delPublisherInstructionDiscriminator).toString('ascii'),
    PythEventType.DelPublisher,
  ],
  [
    Buffer.from(updPriceInstructionDiscriminator).toString('ascii'),
    PythEventType.UpdPrice,
  ],
  [
    Buffer.from(aggPriceInstructionDiscriminator).toString('ascii'),
    PythEventType.AggPrice,
  ],
  [
    Buffer.from(initPriceInstructionDiscriminator).toString('ascii'),
    PythEventType.InitPrice,
  ],
  [
    Buffer.from(setMinPubInstructionDiscriminator).toString('ascii'),
    PythEventType.SetMinPub,
  ],
  [
    Buffer.from(updPriceNoFailOnErrorInstructionDiscriminator).toString(
      'ascii',
    ),
    PythEventType.UpdPriceNoFailOnError,
  ],
  [
    Buffer.from(resizeAccountInstructionDiscriminator).toString('ascii'),
    PythEventType.ResizeAccount,
  ],
])
