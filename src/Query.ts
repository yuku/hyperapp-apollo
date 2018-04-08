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

const shallowEqual = require("fbjs/lib/shallowEqual")

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

export interface QueryState {
  timestamp: any // For force update
}

export interface QueryLocals<Data, Variables> {
  observable: ObservableQuery<Data> | null | undefined
  props: QueryProps<Data, Variables> | null | undefined
  previousData: any
  subscription: ZenObservable.Subscription | null | undefined
  hasMounted: boolean
}

// Act as instance variables of react-apollo's Query module.
const locals: {
  [key: string]: QueryLocals<any, any>
} = {}

// globalState.apollo.query
export interface State {
  modules: {
    [key: string]: QueryState
  }
}

// wiredActions.apollo.query
export interface Actions {
  initializeQueryObservable: (params: { props: QueryProps<any, any>; client: ApolloClient<any> }) => void
  didMount: (props: QueryProps<any, any>) => void
  willReceiveProps: (props: QueryProps<any, any>) => void
  willUnmount: (props: QueryProps<any, any>) => void
  startQuerySubscription: (key: string) => void
  removeQuerySubscription: (key: string) => void
  updateQuery: (props: QueryProps<any, any>) => void
  updateCurrentData: (key: string) => void
  resubscribeToQuery: (key: string) => void
  _getState: (key: string) => Promise<{ state: QueryState; local: QueryLocals<any, any> }> // For debugging
  modules: {
    setData: (data: { key: string; data: Partial<QueryState> }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  initializeQueryObservable: (params: { props: QueryProps; client: ApolloClient<any> }) => (_, actions) => {
    locals[params.props.key] = {
      observable: params.client.watchQuery(extractWatchQueryOptions(params.props)),
      props: null,
      previousData: undefined,
      subscription: undefined,
      hasMounted: false
    }
    actions.modules.setData({
      key: params.props.key,
      data: {
        timestamp: Date.now()
      }
    })
  },
  didMount: (props: QueryProps) => (_, actions) => {
    locals[props.key].hasMounted = true
    if (!props.skip) {
      actions.startQuerySubscription(props.key)
    }
  },
  willReceiveProps: (nextProps: QueryProps) => (_, actions) => {
    const key = nextProps.key
    const prevProps = locals[key].props!
    if (nextProps.skip && !prevProps.skip) {
      actions.removeQuerySubscription(key)
      return
    }
    if (shallowEqual(prevProps, nextProps)) {
      return
    }
    if (prevProps.query !== nextProps.query) {
      actions.removeQuerySubscription(key)
    }
    actions.updateQuery(nextProps)
    if (nextProps.skip) {
      return
    }
    actions.startQuerySubscription(key)
  },
  willUnmount: (props: QueryProps) => (_, actions) => {
    actions.removeQuerySubscription(props.key)
    delete locals[props.key]
    return {
      modules: omit(state.modules, props.key)
    }
  },
  updateQuery: (props: QueryProps) => {
    locals[props.key].observable!.setOptions(extractWatchQueryOptions(props))
  },
  startQuerySubscription: (key: string) => (_, actions) => {
    const local = locals[key]
    if (local.subscription) {
      return
    }
    let current: QueryResult | undefined = getQueryResult(key)
    const previousData = current.loading || current.error ? local.previousData : current.data
    local.previousData = previousData
    local.subscription = local.observable!.subscribe({
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
  },
  removeQuerySubscription: (key: string) => {
    if (locals[key].subscription) {
      locals[key].subscription!.unsubscribe()
      locals[key].subscription = undefined
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
  resubscribeToQuery: (key: string) => (_, actions) => {
    actions.removeQuerySubscription(key)
    const lastError = locals[key].observable!.getLastError()
    const lastResult = locals[key].observable!.getLastResult()
    // If lastError is set, the observable will immediately
    // send it, causing the stream to terminate on initialization.
    // We clear everything here and restore it afterward to
    // make sure the nwe subscription sticks.
    locals[key].observable!.resetLastResults()
    actions.startQuerySubscription(key)
    Object.assign(locals[key].observable!, { lastError, lastResult })
  },
  _getState: (key: string) => state => Promise.resolve({ state: state.modules[key], local: locals[key] }),
  modules: {
    setData
  }
}

function extractWatchQueryOptions(props: QueryProps): WatchQueryOptions {
  return compact(props)
}

function getQueryResult<Data, Variables>(key: string): QueryResult<Data, Variables> {
  const currentResult = locals[key].observable!.currentResult()
  const { loading, networkStatus, errors } = currentResult
  let { error } = currentResult
  if (errors && errors.length) {
    error = new ApolloError({ graphQLErrors: errors })
  }

  const data = loading
    ? Object.assign(Object.create(null), locals[key].previousData, currentResult.data)
    : error ? (locals[key].observable!.getLastResult() || {}).data : currentResult.data

  return {
    data: data as Data,
    error,
    loading,
    networkStatus,
    ...getObservableQueryFields(locals[key].observable!)
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
    if (!locals[props.key]) {
      actions.apollo.initQuery(props)
      return
    }
    if (locals[props.key].hasMounted) {
      actions.apollo.query.willReceiveProps(props)
    }
    const vnode: VNode<any> = resolveNode(
      props.render(getQueryResult<Data, Variables>(props.key), children),
      state,
      actions
    )
    vnode.attributes = addLifeCycleHandlers(
      {
        key: props.key,
        ...vnode.attributes
      },
      {
        oncreate() {
          actions.apollo.query.didMount(props)
        },
        onremove(_, done) {
          actions.apollo.query.willUnmount(props)
          done()
        }
      }
    )
    // This value becomes prevProps in actions.willReceiveProps().
    locals[props.key].props = props
    return vnode
  }
}
