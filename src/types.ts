import { GraphQLError } from "graphql"
import { FetchMoreOptions, FetchMoreQueryOptions } from "apollo-client"

export interface QueryAttributes<Data = {}, Variables = {}> {
  data: Data | null | undefined
  errors: GraphQLError[] | null | undefined
  variables: Variables
  loading: boolean
  fetchMore: (options: FetchMoreOptions & FetchMoreQueryOptions) => void
  refetch: () => void
}

export interface MutationAttributes<Data = {}, Variables = {}> {
  data: Data | null | undefined
  errors: GraphQLError[] | null | undefined
  loading: boolean
  called: boolean
  execute: (data: { variables?: Variables }) => void
}
