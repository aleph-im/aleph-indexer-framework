import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import fetch from 'node-fetch'
import { AbiItem } from 'web3-utils'
import { config } from '@aleph-indexer/core'
import { EthereumClient } from '../../../../rpc/ethereum/index.js'

export type Abi = [AbiItem]

// @todo: Implement inmemory cache
export class AbiFactory {
  constructor(
    protected basePath: string,
    protected ethereumClient: EthereumClient,
    protected apiKey = config.ETHEREUM_SCAN_API_KEY,
  ) {}

  async getAbi(address: string): Promise<Abi | undefined> {
    address = address.toLowerCase()

    let abi = await this.getAbiFromCache(address)
    if (abi) return abi

    const isContract = await this.checkContractAddress(address)
    if (!isContract) return

    abi = await this.getAbiFromRemote(address)
    if (!abi) throw new Error(`Abi not found for address ${address}`)

    await this.saveAbiInCache(address, abi)

    console.log(`ABI ${address}`, abi)
    return abi
  }

  protected async getAbiFromCache(address: string): Promise<Abi | void> {
    try {
      const cachePath = path.join(this.basePath, `${address}.json`)
      console.log('load abi from cache => ', cachePath)

      const file = await readFile(cachePath, 'utf8')
      const abi = JSON.parse(file)

      console.log('cached abi => ', abi)

      return abi
    } catch (e) {
      // @note: module not found
      if ((e as any)?.code === 'ENOENT') return undefined

      console.log('cached abi error', e)
      throw e
    }
  }

  protected async saveAbiInCache(address: string, abi: Abi): Promise<void> {
    const cachePath = path.join(this.basePath, `${address}.json`)
    console.log('save abi in cache => ', cachePath)
    await writeFile(cachePath, JSON.stringify(abi))
  }

  protected async getAbiFromRemote(address: string): Promise<Abi> {
    const response = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}${
        this.apiKey ? `&apikey=${this.apiKey}` : ''
      }`,
    )

    // @note: http errors
    if (response.status !== 200) throw new Error(await response.text())

    const body: any = await response.json()
    console.log(body)

    // @note: Rate limit error sent with status 200 OK...
    // {
    //   "status": "0",
    //   "message": "NOTOK",
    //   "result": "Max rate limit reached, please use API Key for higher rate limit"
    // }
    if (body.status === '0' || body.message === 'NOTOK')
      throw new Error(body.result)

    return body.result as Abi
  }

  protected async checkContractAddress(address: string): Promise<boolean> {
    const code = await this.ethereumClient.getContractCode(address)
    console.log('---- check code ---->', address, code)

    if (code.length <= 2) return false

    return true
  }
}
