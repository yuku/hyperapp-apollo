import { GraphQLError } from "graphql"

export interface QueryAttributes<Data = {}, Variables = {}> {
  data: Data | null | undefined
  errors: GraphQLError[] | null | undefined
  variables: Variables
  loading: boolean
  refetch: () => void
}
