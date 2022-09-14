export type LayoutImplementation = {
  name: string
  programID: string
  getInstructionType: (data: Buffer) => string | undefined
  accountLayoutMap: Partial<Record<any, any>>
  dataLayoutMap: Partial<Record<any, any>>
  accountDataLayoutMap: Partial<Record<any, any>>
  eventType: unknown
}
