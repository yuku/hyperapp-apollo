import { FetchMoreOptions, FetchMoreQueryOptions, PureQueryOptions } from "apollo-client"
import { DataProxy } from "apollo-cache"
import { FetchResult } from "apollo-link"

export type RefetchQueriesProviderFn = (...args: any[]) => string[] | PureQueryOptions[]

export interface OperationVariables {
  [key: string]: any
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

// Imported from react-apollo. Replace with original if it is ported back to Apollo Client
export declare type MutationUpdaterFn<
  T = {
    [key: string]: any
  }
> = (proxy: DataProxy, mutationResult: FetchResult<T>) => void
