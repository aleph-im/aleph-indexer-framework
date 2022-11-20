export interface BlockchainFetcherI {
  init(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  addAccount(account: string): Promise<void>
}
