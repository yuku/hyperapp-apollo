import { GraphQLError } from "graphql"
import { FetchMoreOptions, FetchMoreQueryOptions } from "apollo-client"

export interface OperationVariables {
  [key: string]: any
}

export interface MutationAttributes<Data = {}, Variables = {}> {
  data: Data | null | undefined
  errors: GraphQLError[] | null | undefined
  loading: boolean
  called: boolean
  execute: (data: { variables?: Variables }) => void
}

// Imported from react-apollo. Replace with original if it is ported back to Apollo Client
export interface FetchMoreOptions<TData, TVariables> {
  updateQuery: (
    previousQueryResult: TData,
    options: {
      fetchMoreResult?: TData
      variables: TVariables
    }
  ) => TData
}

// Imported from react-apollo. Replace with original if it is ported back to Apollo Client
export interface FetchMoreQueryOptions<TVariables, K extends keyof TVariables> {
  variables: Pick<TVariables, K>
}
