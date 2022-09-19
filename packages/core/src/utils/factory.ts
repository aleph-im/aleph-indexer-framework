import { Mutex } from './concurrence/index.js'

export interface FactoryConstructor<T> {
  new (...args: any[]): T
}

export interface FactoryModule<T> {
  default: FactoryConstructor<T>
}

export abstract class AsyncModuleFactory {
  protected static baseModuleId: string | undefined = 'base'
  private static instancePool: Record<string, any> = {}
  private static instanceMutex: Record<string, Mutex> = {}

  static async importModule(moduleId: string): Promise<FactoryModule<any>> {
    throw new Error(
      `${this.name} factory: 
      "importModule" method not implemented in ${__dirname}`,
    )
  }

  static async get(
    moduleId: string | undefined = this.baseModuleId,
    ...args: any[]
  ): Promise<any | undefined> {
    let mod: FactoryModule<any> | undefined

    if (moduleId) {
      try {
        mod = await this.importModule(moduleId)
      } catch (e) {
        console.log(
          `${this.name} factory: Failed importing ${moduleId} module, trying ${this.baseModuleId} as fallback`,
          e,
        )

        if (this.baseModuleId) {
          mod = await this.importModule(this.baseModuleId)
        }
      }
    }

    if (!mod) {
      throw new Error(
        `${this.name} factory: 
        ${
          moduleId || this.baseModuleId
        } module does not exists in ${__dirname}`,
      )
    }

    if (!('default' in mod)) {
      throw new Error(
        `${this.name} factory: 
        ${moduleId || this.baseModuleId} 
        dont have a default exported constructor in ${__dirname}`,
      )
    }

    const constructor: FactoryConstructor<any> = mod.default
    return new constructor(...args)
  }

  static async getSingleton(
    moduleId?: string,
    instanceKey = 'default',
    ...args: any[]
  ): Promise<any | undefined> {
    const key = `${this.name}|${moduleId}|${instanceKey}`

    const release = await this._getInstanceMutex(key).acquire()

    try {
      let instance: any | undefined = this.instancePool[key]

      if (!instance) {
        instance = await this.get(moduleId, ...args)
        this.instancePool[key] = instance
      }

      return instance
    } finally {
      release()
    }
  }

  private static _getInstanceMutex(key: string): Mutex {
    return (this.instanceMutex[key] = this.instanceMutex[key] || new Mutex())
  }
}
