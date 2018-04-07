import { Component, ActionsType, VNode } from "hyperapp"
import {
  ApolloQueryResult,
  ObservableQuery,
  ApolloClient,
  FetchPolicy,
  ErrorPolicy,
  ApolloError,
  NetworkStatus,
  WatchQueryOptions
} from "apollo-client"
import { DocumentNode } from "graphql"

import * as apollo from "./apollo"
import addLifeCycleHandlers from "./util/addLifeCycleHandlers"
import setData from "./util/setData"
import compact from "./util/compact"
import omit from "./util/omit"
import resolveNode from "./util/resolveNode"
import { OperationVariables, FetchMoreOptions, FetchMoreQueryOptions } from "./types"

export type ObservableQueryFields<Data, Variables> = Pick<
  ObservableQuery<Data>,
  "startPolling" | "stopPolling" | "subscribeToMore"
> & {
  variables: Variables
  refetch: (variables?: Variables) => Promise<ApolloQueryResult<Data>>
  fetchMore: (<K extends keyof Variables>(
    fetchMoreOptions: FetchMoreQueryOptions<Variables, K> & FetchMoreOptions<Data, Variables>
  ) => Promise<ApolloQueryResult<Data>>) &
    (<Data2, Variables2, K extends keyof Variables2>(
      fetchMoreOptions: { query: DocumentNode } & FetchMoreQueryOptions<Variables2, K> &
        FetchMoreOptions<Data2, Variables2>
    ) => Promise<ApolloQueryResult<Data2>>)
  updateQuery: (mapFn: (previousQueryResult: Data, options: { variables?: Variables }) => Data) => void
}

// Props of render component.
export type QueryResult<Data = any, Variables = OperationVariables> = ObservableQueryFields<Data, Variables> & {
  data: Data | undefined
  error?: ApolloError
  loading: boolean
  networkStatus: NetworkStatus
}

// Props of <Query/> component.
export interface QueryProps<Data = any, Variables = OperationVariables> {
  errorPolicy?: ErrorPolicy
  fetchPolicy?: FetchPolicy
  key: string // Globally unique key
  notifyOnNetworkStatusChange?: boolean
  pollInterval?: number
  query: DocumentNode
  render: Component<QueryResult<Data, Variables>, any, any>
  skip?: boolean
  variables: Variables
}

export interface QueryModuleState<Data> {
  observable: ObservableQuery<Data> | null
  previousData: any
  subscription: ZenObservable.Subscription
  timestamp: any // For force update
}

// globalState.apollo.query
export interface State {
  modules: {
    [key: string]: QueryModuleState<any>
  }
}

// wiredActions.apollo.query
export interface Actions {
  initializeQueryObservable: (params: { props: QueryProps<any, any>, client: ApolloClient<any> }) => void
  startQuerySubscription: (key: string) => void
  removeQuerySubscription: (key: string) => void
  updateQuery: (params: QueryProps<any, any>) => void
  updateCurrentData: (key: string) => void
  resubscribeToQuery: (key: string) => void
  destroy: (key: string) => void
  modules: {
    setData: (data: { key: string; data: Partial<QueryModuleState<any>> }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  initializeQueryObservable: (params: { props: QueryProps, client: ApolloClient<any> }) => (_, actions) => {
    actions.modules.setData({
      key: params.props.key,
      data: {
        observable: params.client.watchQuery(extractWatchQueryOptions(params.props))
      }
    })
  },
  updateQuery: (params: QueryProps) => state => {
    state.modules[params.key].observable!.setOptions(extractWatchQueryOptions(params))
  },
  startQuerySubscription: (key: string) => (state, actions) => {
    const moduleState = state.modules[key]
    if (moduleState.subscription) {
      return
    }
    let current: QueryResult | undefined = getQueryResult(moduleState)
    const previousData = current.loading || current.error ? moduleState.previousData : current.data
    actions.modules.setData({
      key,
      data: {
        previousData,
        subscription: moduleState.observable!.subscribe({
          next() {
            // To prevent a quick second render from the subscriber
            // we compare to see if the original started finised (from cache)
            if (current && current.networkStatus === 7) {
              // remove this for future rerenders (i.e. polling)
              current = undefined
              return
            }
            actions.updateCurrentData(key)
          },
          error(error) {
            actions.resubscribeToQuery(key)
            if (!error.hasOwnProperty("graphQLErrors")) {
              throw error
            }
            actions.updateCurrentData(key)
          }
        })
      }
    })
  },
  removeQuerySubscription: (key: string) => (state, actions) => {
    const moduleState = state.modules[key]
    if (moduleState.subscription) {
      moduleState.subscription.unsubscribe()
      actions.modules.setData({
        key,
        data: {
          subscription: undefined
        }
      })
    }
  },
  updateCurrentData: (key: string) => (_, actions) => {
    actions.modules.setData({
      key,
      data: {
        timestamp: Date.now()
      }
    })
  },
  resubscribeToQuery: (key: string) => (state, actions) => {
    actions.removeQuerySubscription(key)
    const moduleState = state.modules[key]
    const lastError = moduleState.observable!.getLastError()
    const lastResult = moduleState.observable!.getLastResult()
    // If lastError is set, the observable will immediately
    // send it, causing the stream to terminate on initialization.
    // We clear everything here and restore it afterward to
    // make sure the nwe subscription sticks.
    moduleState.observable!.resetLastResults()
    actions.startQuerySubscription(key)
    Object.assign(moduleState.observable!, { lastError, lastResult })
  },
  destroy: (key: string) => (state, actions) => {
    actions.removeQuerySubscription(key)
    return {
      modules: omit(state.modules, key)
    }
  },
  modules: {
    setData
  }
}

function extractWatchQueryOptions(props: QueryProps): WatchQueryOptions {
  return compact(props)
}

function getQueryResult<Data, Variables>(state: QueryModuleState<Data>): QueryResult<Data, Variables> {
  const currentResult = state.observable!.currentResult()
  const { loading, networkStatus, errors } = currentResult
  let { error } = currentResult
  if (errors && errors.length) {
    error = new ApolloError({ graphQLErrors: errors })
  }

  const data = loading
    ? Object.assign(Object.create(null), state.previousData, currentResult.data)
    : error ? (state.observable!.getLastResult() || {}).data : currentResult.data
  // TODO: update previousData as currentResult.data

  return {
    data: data as Data,
    error,
    loading,
    networkStatus,
    ...getObservableQueryFields(state.observable!)
  }
}

function getObservableQueryFields<Data, Variables>(observable: ObservableQuery<Data>) {
  const fields = {
    // Pick<ObservableQuery<Data>, "startPolling" | "stopPolling" | "subscribeToMore">
    startPolling: observable.startPolling.bind(observable),
    stopPolling: observable.stopPolling.bind(observable),
    subscribeToMore: observable.subscribeToMore.bind(observable),
    // rest
    variables: observable.variables,
    refetch: observable.refetch.bind(observable),
    fetchMore: observable.fetchMore.bind(observable),
    updateQuery: observable.updateQuery.bind(observable)
  }
  return fields as ObservableQueryFields<Data, Variables>
}

export function Query<Data, Variables>(props: QueryProps<Data, Variables>, children: any) {
  return (state: { apollo: apollo.State }, actions: { apollo: apollo.Actions }) => {
    const moduleState: QueryModuleState<Data> | void = state.apollo.query.modules[props.key]
    if (!moduleState) {
      actions.apollo.initQuery(props)
      return
    }
    const vnode = resolveNode(props.render(getQueryResult(moduleState), children), state, actions)
    vnode.attributes = addLifeCycleHandlers(
      {
        ...vnode.attributes,
        skip: props.skip,
        query: props.query,
        key: props.key
      },
      {
        oncreate() {
          if (!props.skip) {
            actions.apollo.query.startQuerySubscription(props.key)
          }
        },
        onupdate(_, prevProps: QueryProps<Data, Variables>) {
          if (!prevProps.skip && props.skip) {
            actions.apollo.query.removeQuerySubscription(props.key)
            return
          }
          if (prevProps.query === props.query) {
            return
          }
          actions.apollo.query.removeQuerySubscription(props.key)
          actions.apollo.query.updateQuery(props)
          if (!props.skip) {
            actions.apollo.query.startQuerySubscription(props.key)
          }
        },
        ondestroy() {
          actions.apollo.query.destroy(props.key)
        }
      }
    )
    return vnode
  }
}
