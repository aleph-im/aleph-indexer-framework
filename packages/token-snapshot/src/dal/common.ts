import BN from 'bn.js'

export function getBigNumberMapFn(
  mappedProps: string[],
): (arg0: any) => Promise<any> {
  return async function (entry: { key: any; value: any }) {
    const { key, value } = entry

    // @note: Stored as hex strings (bn.js "toJSON" method), so we need to cast them to BN always
    for (const prop of mappedProps) {
      if (!(prop in value)) continue
      if ((value as any)[prop] instanceof BN) continue
      ;(value as any)[prop] = new BN((value as any)[prop], 'hex')
    }

    return { key, value }
  }
}
