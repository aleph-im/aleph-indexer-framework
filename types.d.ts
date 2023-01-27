declare module '@solana/web3.js' {
  interface Connection {
    public _rpcRequest(method: string, args: any[]): getAllValuesFromTo<any>
    public _rpcBatchRequest(requests: any[]): getAllValuesFromTo<any>
  }
}

declare module 'graphql-type-long'

declare module 'node:stream' {
  function compose(...streams: Array<Stream | Iterable | AsyncIterable>): Duplex
}
