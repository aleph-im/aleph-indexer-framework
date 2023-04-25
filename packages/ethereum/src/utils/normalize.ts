import { IndexableEntityType } from '@aleph-indexer/framework'

export function normalizeAccount(account: string): string {
  return account.toLowerCase()
}

export function normalizeEntityId(
  entity: IndexableEntityType,
  id: string,
): string {
  return id.toLowerCase()
}
