export type EthereumBlockFetcherState = {
  fetcher: string
  firstTimestamp?: number
  lastTimestamp?: number
  firstHeight?: number
  lastHeight?: number
  completeHistory: boolean
}

export type EthereumSignatureFetcherState = {
  fetcher: string
  account: string
  firstHeight?: number
  lastHeight?: number
  firstTimestamp?: number
  lastTimestamp?: number
  firstSignature?: string
  lastSignature?: string
  completeHistory: boolean
}
