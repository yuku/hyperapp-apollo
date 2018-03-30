import { h, Component, ActionsType } from "hyperapp"
import { ApolloQueryResult, ObservableQuery, ApolloClient } from "apollo-client"
import { isEqual } from "apollo-utilities"

import * as apollo from "./apollo"
import addLifeCycleHandlers from "./util/addLifeCycleHandlers"
import setData from "./util/setData"
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
  update: (data: { id: string; variables: any; oldVariables: any }) => void
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
  }) => (_, actions) => {
    const observable = client.watchQuery({ query, variables })
    actions.modules.setData({ id, data: { observable } })
    observable
      .result()
      .then(result => actions.modules.setData({ id, data: { result } }))
  },
  update: ({ id, variables, oldVariables }) => ({ modules }, actions) => {
    if (!isEqual(variables, oldVariables)) {
      modules[id]
        .observable!.setVariables(variables)
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
    setData
  }
}

let counter = 0

function getRenderProps<Data, Variables>(
  state: QueryModuleState | undefined,
  actions: Actions,
  id: string
): QueryAttributes<Data, Variables> {
  const observable = state && state.observable
  const result = state && state.result
  return {
    variables: observable && (observable.variables as any),
    data:
      result && Object.keys(result.data).length ? (result.data as Data) : null,
    errors: result && result.errors,
    loading: result ? result.loading : true,
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
      getRenderProps<Data, Variables>(
        state.query.modules[id],
        actions.query,
        id
      )
    )
    vnode.attributes = addLifeCycleHandlers(
      {
        ...vnode.attributes,
        key: id
      },
      {
        oncreate: () => actions.initQuery({ id, query, variables }),
        onupdate: (_, old) =>
          actions.query.update({ id, variables, oldVariables: old.variables }),
        ondestroy: () => actions.query.destroy({ id })
      }
    )
    return vnode
  }
}
