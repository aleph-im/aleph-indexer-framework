declare module '@solana/web3.js' {
  interface Connection {
    public _rpcRequest(method: string, args: any[]): Promise<any>
    public _rpcBatchRequest(requests: any[]): Promise<any>
  }
}

declare module 'graphql-type-long'
