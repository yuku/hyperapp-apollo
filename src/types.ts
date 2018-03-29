import { GraphQLError } from "graphql"

export interface QueryAttributes<Data = {}, Variables = {}> {
  data: Data | null | undefined
  errors: GraphQLError[] | null | undefined
  variables: Variables
  loading: boolean
  refetch: () => void
}

export interface MutationAttributes<Data = {}, Variables = {}> {
  data: Data | null | undefined
  errors: GraphQLError[] | null | undefined
  loading: boolean
  called: boolean
  execute: (data: { variables?: Variables }) => void
}
