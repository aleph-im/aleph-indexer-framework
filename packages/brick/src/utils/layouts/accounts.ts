import {
  appDiscriminator,
  appBeet,
  paymentDiscriminator,
  paymentBeet,
  tokenMetadataDiscriminator,
  tokenMetadataBeet,
} from './solita/index.js'

export enum AccountType {
  App = 'App',
  Payment = 'Payment',
  TokenMetadata = 'TokenMetadata',
}

export const ACCOUNT_DISCRIMINATOR: Record<AccountType, Buffer> = {
  [AccountType.App]: Buffer.from(appDiscriminator),
  [AccountType.Payment]: Buffer.from(paymentDiscriminator),
  [AccountType.TokenMetadata]: Buffer.from(tokenMetadataDiscriminator),
}

export const ACCOUNTS_DATA_LAYOUT: Record<AccountType, any> = {
  [AccountType.App]: appBeet,
  [AccountType.Payment]: paymentBeet,
  [AccountType.TokenMetadata]: tokenMetadataBeet,
}
