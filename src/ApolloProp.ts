export default interface ApolloProp<T = any> {
  data: T | null
  errors:
    | {
        message: string
        locations?: {
          line: number
          column: number
        }
        path?: string[]
        extensions?: any
      }[]
    | null
  fetching: boolean
  refetch: () => void
}
