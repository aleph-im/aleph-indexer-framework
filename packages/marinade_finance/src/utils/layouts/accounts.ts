import {
  stateDiscriminator,
  stateBeet,
  ticketAccountDataDiscriminator,
  ticketAccountDataBeet,
} from './solita/index.js'

export enum AccountType {
  State = 'State',
  TicketAccountData = 'TicketAccountData',
}

export const ACCOUNT_DISCRIMINATOR: Record<AccountType, Buffer> = {
  [AccountType.State]: Buffer.from(stateDiscriminator),
  [AccountType.TicketAccountData]: Buffer.from(ticketAccountDataDiscriminator),
}

export const ACCOUNTS_DATA_LAYOUT: Record<AccountType, any> = {
  [AccountType.State]: stateBeet,
  [AccountType.TicketAccountData]: ticketAccountDataBeet,
}
