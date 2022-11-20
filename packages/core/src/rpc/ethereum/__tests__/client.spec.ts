import { EthereumClient } from '../client.js'

const url =
  process.env.ETH_RPC ||
  'https://mainnet.infura.io/v3/9a954e6106ae4f26ba23d496d0837ba3'

describe('ethereum client functional tests', () => {
  it('should fetch blocks', async () => {
    const client = new EthereumClient({ url })

    const blocks = client.fetchBlocks({
      before: 3000,
      maxLimit: Number.MAX_SAFE_INTEGER,
    })

    for await (const { chunk, firstKey, lastKey } of blocks) {
      console.log('---->', chunk.length, firstKey, lastKey)
    }
  })
})
