export abstract class Singleton {
  static _instance: Record<string, Singleton> = {}

  static getInstance(name: string, ...args: any[]): Singleton {
    let instance: Singleton = this._instance[name]

    if (!instance) {
      instance = new (this as any)(name, ...args)
    }

    return instance
  }

  protected constructor() {
    // Override it
  }
}
