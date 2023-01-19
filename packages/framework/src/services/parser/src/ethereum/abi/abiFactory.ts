import fs from 'fs'
import fetch from 'node-fetch'
import { AbiItem } from 'web3-utils'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)

export type Abi = AbiItem

export class AbiFactory {
  protected static baseModuleId: string | undefined = undefined

  static async getAbi(address: string): Promise<Abi> {
    let abi = await this.getAbiFromCache(address)
    if (abi) return abi

    abi = await this.getAbiFromRemote(address)
    if (!abi) throw new Error(`Abi not found for address ${address}`)

    await writeFile(`./cache/${address}.json`, JSON.stringify(abi))

    return abi
  }

  static async getAbiFromCache(address: string): Promise<Abi> {
    return import(`./cache/${address}.json`)
  }

  static async getAbiFromRemote(address: string): Promise<Abi> {
    const response = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}`,
    )

    return (await response.json()) as AbiItem
  }
}
