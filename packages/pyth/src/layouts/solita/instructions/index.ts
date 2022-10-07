export * from './addMapping.js'
export * from './addPrice.js'
export * from './addProduct.js'
export * from './addPublisher.js'
export * from './aggPrice.js'
export * from './delPublisher.js'
export * from './initMapping.js'
export * from './initPrice.js'
export * from './resizeAccount.js'
export * from './setMinPub.js'
export * from './updPrice.js'
export * from './updPriceNoFailOnError.js'
export * from './updProduct.js'

import * as addMapping from './addMapping.js'
import * as addPrice from './addPrice.js'
import * as addProduct from './addProduct.js'
import * as addPublisher from './addPublisher.js'
import * as aggPrice from './aggPrice.js'
import * as delPublisher from './delPublisher.js'
import * as initMapping from './initMapping.js'
import * as initPrice from './initPrice.js'
import * as resizeAccount from './resizeAccount.js'
import * as setMinPub from './setMinPub.js'
import * as updPrice from './updPrice.js'
import * as updPriceNoFailOnError from './updPriceNoFailOnError.js'
import * as updProduct from './updProduct.js'

export enum InstructionType {
  addMapping = 'addMapping',
  addPrice = 'addPrice',
  addProduct = 'addProduct',
  addPublisher = 'addPublisher',
  aggPrice = 'aggPrice',
  delPublisher = 'delPublisher',
  initMapping = 'initMapping',
  initPrice = 'initPrice',
  resizeAccount = 'resizeAccount',
  setMinPub = 'setMinPub',
  updPrice = 'updPrice',
  updPriceNoFailOnError = 'updPriceNoFailOnError',
  updProduct = 'updProduct',
}

export const IX_METHOD_CODE: Record<string, InstructionType | undefined> = {
  [0]: InstructionType.addMapping,
  [1]: InstructionType.addPrice,
  [2]: InstructionType.addProduct,
  [3]: InstructionType.addPublisher,
  [4]: InstructionType.aggPrice,
  [5]: InstructionType.delPublisher,
  [6]: InstructionType.initMapping,
  [7]: InstructionType.initPrice,
  [8]: InstructionType.resizeAccount,
  [9]: InstructionType.setMinPub,
  [10]: InstructionType.updPrice,
  [11]: InstructionType.updPriceNoFailOnError,
  [12]: InstructionType.updProduct,
}

export const IX_DATA_LAYOUT: Partial<Record<InstructionType, any>> = {
  [InstructionType.addMapping]: addMapping.addMappingStruct,
  [InstructionType.addPrice]: addPrice.addPriceStruct,
  [InstructionType.addProduct]: addProduct.addProductStruct,
  [InstructionType.addPublisher]: addPublisher.addPublisherStruct,
  [InstructionType.aggPrice]: aggPrice.aggPriceStruct,
  [InstructionType.delPublisher]: delPublisher.delPublisherStruct,
  [InstructionType.initMapping]: initMapping.initMappingStruct,
  [InstructionType.initPrice]: initPrice.initPriceStruct,
  [InstructionType.resizeAccount]: resizeAccount.resizeAccountStruct,
  [InstructionType.setMinPub]: setMinPub.setMinPubStruct,
  [InstructionType.updPrice]: updPrice.updPriceStruct,
  [InstructionType.updPriceNoFailOnError]:
    updPriceNoFailOnError.updPriceNoFailOnErrorStruct,
  [InstructionType.updProduct]: updProduct.updProductStruct,
}

export const IX_ACCOUNTS_LAYOUT: Partial<Record<InstructionType, any>> = {
  [InstructionType.addMapping]: addMapping.AddMappingAccounts,
  [InstructionType.addPrice]: addPrice.AddPriceAccounts,
  [InstructionType.addProduct]: addProduct.AddProductAccounts,
  [InstructionType.addPublisher]: addPublisher.AddPublisherAccounts,
  [InstructionType.aggPrice]: aggPrice.AggPriceAccounts,
  [InstructionType.delPublisher]: delPublisher.DelPublisherAccounts,
  [InstructionType.initMapping]: initMapping.InitMappingAccounts,
  [InstructionType.initPrice]: initPrice.InitPriceAccounts,
  [InstructionType.resizeAccount]: resizeAccount.ResizeAccountAccounts,
  [InstructionType.setMinPub]: setMinPub.SetMinPubAccounts,
  [InstructionType.updPrice]: updPrice.UpdPriceAccounts,
  [InstructionType.updPriceNoFailOnError]:
    updPriceNoFailOnError.UpdPriceNoFailOnErrorAccounts,
  [InstructionType.updProduct]: updProduct.UpdProductAccounts,
}
