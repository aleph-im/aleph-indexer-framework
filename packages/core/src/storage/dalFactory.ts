import { LevelStorage, LevelStorageConstructorI, LevelStorageI } from './common'

export abstract class DALFactory<DAL extends string | number | symbol> {
  protected dalCache: Record<string, LevelStorage<unknown, unknown>> = {}

  constructor(protected name: string) {}

  protected abstract getBasePath(): string

  protected abstract getDALDefaultOptions(
    type: DAL,
    id: string,
  ): Record<string, unknown> | undefined

  protected abstract getDALConstructor(
    type: DAL,
    id: string,
  ): LevelStorageConstructorI<unknown, unknown> | undefined

  get(type: DAL, id: string): LevelStorageI<unknown, unknown> {
    const key = `${String(type)}:${id}`

    let dalInstance = this.dalCache[key]

    if (!dalInstance) {
      const clazz = this.getDALConstructor(type, id) as
        | typeof LevelStorage
        | undefined

      if (!clazz) throw new Error(`Invalid constructor for ${String(type)} DAL`)

      const folder = `${this.getBasePath()}/${this.name}/${id}`
      const options = {
        type,
        id,
        ...this.getDALDefaultOptions(type, id),
      }

      dalInstance = new clazz(`${String(type)}`, {
        folder,
        ...options,
      })

      this.dalCache[key] = dalInstance
    }

    return dalInstance
  }
}
