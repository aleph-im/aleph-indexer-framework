import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import fetch from 'node-fetch'
import { AbiItem } from 'web3-utils'
import { BlockchainId } from '@aleph-indexer/framework'
import { EthereumClient } from '../../../sdk/index.js'

export type Abi = [AbiItem]

// @todo: Implement inmemory cache
export class EthereumAbiFactory {
  constructor(
    protected blockchainId: BlockchainId,
    protected basePath: string,
    protected ethereumClient: EthereumClient,
    protected explorerUrl: string,
  ) {}

  async getAbi(address: string): Promise<Abi | undefined> {
    address = address.toLowerCase()

    let abi = await this.getAbiFromCache(address)
    if (abi) return abi

    const isContract = await this.ethereumClient.isContractAddress(address)
    if (!isContract) return

    abi = await this.getAbiFromRemote(address)
    if (!abi) throw new Error(`Abi not found for address ${address}`)

    await this.saveAbiInCache(address, abi)

    this.log(`ABI ${address}`, abi)
    return abi
  }

  protected async getAbiFromCache(address: string): Promise<Abi | void> {
    try {
      const cachePath = path.join(this.basePath, `${address}.json`)
      this.log('load abi from cache => ', cachePath)

      const file = await readFile(cachePath, 'utf8')
      const abi = JSON.parse(file)

      this.log('cached abi => ', abi)

      return abi
    } catch (e) {
      // @note: module not found
      if ((e as any)?.code === 'ENOENT') return undefined

      this.log('cached abi error', e)
      throw e
    }
  }

  protected async saveAbiInCache(address: string, abi: Abi): Promise<void> {
    const cachePath = path.join(this.basePath, `${address}.json`)
    this.log('save abi in cache => ', cachePath)
    await writeFile(cachePath, JSON.stringify(abi))
  }

  protected async getAbiFromRemote(address: string): Promise<Abi> {
    const url = this.getRemoteUrl(address)
    const response = await fetch(url)

    // @note: http errors
    if (response.status !== 200) throw new Error(await response.text())

    const body: any = await response.json()

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

  protected getRemoteUrl(address: string): string {
    return this.explorerUrl.replaceAll('$ADDRESS', address)
  }

  protected log(...msgs: any[]): void {
    console.log(`${this.blockchainId} ${msgs.join(' ')}`)
  }
}
