import { h, Component, ActionsType } from "hyperapp"
import {
  ApolloCurrentResult,
  ApolloQueryResult,
  ObservableQuery,
  ApolloClient
} from "apollo-client"

import * as apollo from "./apollo"
import result from "./util/result"
import omit from "./util/omit"
import { QueryAttributes } from "./types"

export interface QueryModuleState {
  result: ApolloQueryResult<any> | null
  observable: ObservableQuery<any> | null
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
    }
  ) => void
  destroy: (data: { id: string }) => void
  refetch: (data: { id: string; variables?: any }) => void
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
    client
  }: {
    id: string
    query: any
    variables?: any
    client: ApolloClient<any>
  }) => ({ modules }, actions) => {
    if (!modules[id] || !modules[id].observable) {
      const observable = client.watchQuery({ query, variables })
      actions.modules.setData({ id, data: { observable } })
      observable
        .result()
        .then(result => actions.modules.setData({ id, data: { result } }))
    }
  },
  destroy: ({ id }) => state => ({
    modules: omit(state.modules, id)
  }),
  refetch: ({ id, variables }: { id: string; variables?: any }) => (
    { modules },
    actions
  ) => {
    modules[id]
      .observable!.refetch(variables)
      .then(result => actions.modules.setData({ id, data: { result } }))
  },
  modules: {
    setData: ({
      id,
      data
    }: {
      id: string
      data: Partial<QueryModuleState>
    }) => state => ({
      [id]: {
        ...state[id],
        ...data
      }
    })
  }
}

let counter = 0

function getRenderProps<Data, Variables>(
  state: State,
  actions: Actions,
  id: string
): QueryAttributes<Data, Variables> {
  const observable = state.modules[id] && state.modules[id].observable
  const currentResult: ApolloCurrentResult<Data> | null | undefined =
    observable && observable.currentResult()
  return {
    variables: observable && (observable.variables as any),
    data:
      currentResult && Object.keys(currentResult.data).length
        ? (currentResult.data as Data)
        : null,
    errors: currentResult && currentResult.errors,
    loading: !!currentResult && currentResult.loading,
    refetch: () => actions.refetch({ id })
  }
}

export default function query<Data = {}, Variables = {}>(
  query: any
): Component<
  {
    key?: string
    variables?: Variables
    render: Component<QueryAttributes<Data, Variables>, any, any>
  },
  { apollo: apollo.State },
  { apollo: apollo.Actions }
> {
  const tmp = `q${counter++}`
  return ({ variables, render, key }) => (
    { apollo: state },
    { apollo: actions }
  ) => {
    const id = key ? `${tmp}[${key}]` : tmp
    const vnode = h(
      render,
      getRenderProps<Data, Variables>(state.query, actions.query, id)
    )
    const origOncreate = vnode.attributes && (vnode.attributes as any).oncreate
    const origOndestory =
      vnode.attributes && (vnode.attributes as any).ondestroy
    vnode.attributes = {
      ...vnode.attributes,
      key: id,
      oncreate: (element: HTMLElement) => {
        actions.initQuery({ id, query, variables })
        result(origOncreate, element)
      },
      ondestroy: (element: HTMLElement) => {
        result(origOndestory, element)
        actions.query.destroy({ id })
      }
    } as any
    return vnode
  }
}
