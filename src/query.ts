import { h, Component, ActionsType } from "hyperapp"
import {
  ApolloQueryResult,
  ObservableQuery,
  ApolloClient,
  FetchMoreOptions,
  FetchMoreQueryOptions
} from "apollo-client"
import { isEqual } from "apollo-utilities"

import * as apollo from "./apollo"
import addLifeCycleHandlers from "./util/addLifeCycleHandlers"
import setData from "./util/setData"
import omit from "./util/omit"
import { QueryAttributes } from "./types"

export interface QueryModuleState {
  result: ApolloQueryResult<any> | null
  observable: ObservableQuery<any> | null
  subscription: {
    unsubscribe: () => void
  }
}

export interface State {
  modules: {
    [id: string]: QueryModuleState
  }
}

export interface Actions {
  init: (
    data: {
      id: string
      query: any
      variables?: any
      client: ApolloClient<any>
      notifyOnNetworkStatusChange?: boolean
    }
  ) => void
  update: (data: { id: string; variables: any }) => void
  destroy: (data: { id: string }) => void
  modules: {
    setData: (data: { id: string; data: Partial<QueryModuleState> }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  init: ({
    id,
    query,
    variables,
    client,
    notifyOnNetworkStatusChange
  }: {
    id: string
    query: any
    variables?: any
    client: ApolloClient<any>
    notifyOnNetworkStatusChange?: boolean
  }) => (_, actions) => {
    const observable = client.watchQuery({
      query,
      variables,
      notifyOnNetworkStatusChange
    })
    const subscription = observable.subscribe(result =>
      actions.modules.setData({ id, data: { result } })
    )
    actions.modules.setData({ id, data: { observable, subscription } })
  },
  update: ({ id, variables }) => ({ modules }, actions) => {
    modules[id]
      .observable!.setVariables(variables)
      .then(result => actions.modules.setData({ id, data: { result } }))
  },
  destroy: ({ id }) => ({ modules }) => {
    modules[id].subscription.unsubscribe()
    return {
      modules: omit(modules, id)
    }
  },
  modules: {
    setData
  }
}

let counter = 0

function getRenderProps<Data, Variables>(
  state: QueryModuleState | undefined
): QueryAttributes<Data, Variables> {
  const observable = state && state.observable
  const result = state && state.result
  return {
    variables: observable && (observable.variables as any),
    data:
      result && Object.keys(result.data).length ? (result.data as Data) : null,
    errors: result && result.errors,
    loading: result ? result.loading : true,
    refetch: () => observable && observable.refetch(),
    fetchMore: (option: FetchMoreOptions & FetchMoreQueryOptions) =>
      observable && observable.fetchMore(option)
  }
}

function renderComponent<Data, Variables>(
  state: State,
  id: string,
  render: Component<any, any, any>
) {
  return h(render, getRenderProps<Data, Variables>(state.modules[id]))
}

export default function query<Data = {}, Variables = {}>(
  query: any
): Component<
  {
    key?: string
    variables?: Variables
    notifyOnNetworkStatusChange?: boolean
    render: Component<QueryAttributes<Data, Variables>, any, any>
  },
  { apollo: apollo.State },
  { apollo: apollo.Actions }
> {
  const tmp = `q${counter++}`
  return ({ variables, render, key, notifyOnNetworkStatusChange }) => (
    { apollo: state },
    { apollo: actions }
  ) => {
    const id = key ? `${tmp}[${key}]` : tmp
    const vnode = renderComponent<Data, Variables>(state.query, id, render)
    vnode.attributes = addLifeCycleHandlers(
      {
        ...vnode.attributes,
        key: id
      },
      {
        oncreate: () =>
          actions.initQuery({
            id,
            query,
            variables,
            notifyOnNetworkStatusChange
          }),
        onupdate: (_, old) => {
          if (!isEqual(variables, old.variables)) {
            actions.query.update({ id, variables })
          }
        },
        ondestroy: () => actions.query.destroy({ id })
      }
    )
    return vnode
  }
}
