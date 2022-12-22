import { EntityStorage } from '../../../storage/entityStorage.js'

export type AccountState = { account: string }
export type AccountStateStorage<T extends AccountState> = EntityStorage<T>
