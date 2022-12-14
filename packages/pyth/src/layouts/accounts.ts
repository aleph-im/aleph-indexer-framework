import { priceAccountBeet, productAccountBeet } from './solita/index.js'

export enum AccountsType {
  PriceAccount = 'PriceAccount',
  ProductAccount = 'ProductAccount',
}

export const ACCOUNT_DISCRIMINATOR: Record<AccountsType, Buffer> = {
  [AccountsType.PriceAccount]: Buffer.from('3'),
  [AccountsType.ProductAccount]: Buffer.from('2'),
}

export const ACCOUNTS_DATA_LAYOUT: Record<AccountsType, any> = {
  [AccountsType.PriceAccount]: priceAccountBeet,
  [AccountsType.ProductAccount]: productAccountBeet,
}
