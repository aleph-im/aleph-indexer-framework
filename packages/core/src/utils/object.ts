export class MatrixMap<K, V extends MatrixMap<any, any>> extends Map<K, V> {
  get(key: K): V {
    let val = super.get(key)

    if (val === undefined) {
      val = new MatrixMap() as V
      super.set(key, val)
    }

    return val
  }
}
