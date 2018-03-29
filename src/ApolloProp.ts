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
  loading: boolean
  refetch: () => void
}
