import { h, Component, ActionsType } from "hyperapp"
import {
  ApolloCurrentResult,
  ApolloQueryResult,
  ObservableQuery,
  ApolloClient
} from "apollo-client"

import * as apollo from "./apollo"
import { QueryAttributes } from "./types"

export interface State {
  modules: {
    [id: string]: {
      result: ApolloQueryResult<any> | null
      observable: ObservableQuery<any> | null
    }
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
  refetch: (data: { id: string; variables?: any }) => void
  modules: {
    setData: (data: { id: string; data: any }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  init: ({ id, query, variables, client }) => async ({ modules }, actions) => {
    if (!modules[id] || !modules[id].observable) {
      const observable = client.watchQuery({ query, variables })
      actions.modules.setData({ id, data: { observable } })
      const result = await observable.result()
      actions.modules.setData({ id, data: { result } })
    }
  },
  refetch: ({ id, variables }) => async ({ modules }, actions) => {
    const result = await modules[id].observable!.refetch(variables)
    actions.modules.setData({ id, data: { result } })
  },
  modules: {
    setData: ({ id, data }) => state => ({
      [id]: {
        ...state[id],
        ...data
      }
    })
  }
}

let counter = 0

function getRenderProps<Data, Variables>(
  state: apollo.State,
  actions: apollo.Actions,
  id: string,
  variables: Variables | undefined
) {
  const currentResult: ApolloCurrentResult<Data> | null | undefined =
    state.query.modules[id] &&
    state.query.modules[id].observable &&
    state.query.modules[id].observable!.currentResult()
  return {
    variables: variables as Variables, // Apollo checks if undefined in runtime
    data:
      currentResult && Object.keys(currentResult.data).length
        ? (currentResult.data as Data)
        : null,
    errors: currentResult && currentResult.errors,
    loading: !!currentResult && currentResult.loading,
    refetch: () => actions.query.refetch({ id, variables })
  }
}

const query = <Data = {}, Variables = {}>(
  query: any
): Component<
  {
    key?: string
    variables?: Variables
    render: Component<QueryAttributes<Data, Variables>, any, any>
  },
  { apollo: apollo.State },
  { apollo: apollo.Actions }
> => {
  const tmp = `q${counter++}`
  return ({ variables, render, key }) => (
    { apollo: state },
    { apollo: actions }
  ) => {
    const id = key ? `${tmp}[${key}]` : tmp
    const vnode = h(
      render,
      getRenderProps<Data, Variables>(state, actions, id, variables),
      []
    )
    const origOncreate = vnode.attributes && (vnode.attributes as any).oncreate
    vnode.attributes = {
      ...vnode.attributes,
      key: id,
      oncreate: (element: HTMLElement) => {
        actions.initQuery({ id, query, variables })
        // tslint:disable-next-line:no-unused-expression
        origOncreate && origOncreate(element)
      }
    } as any
    return vnode
  }
}

export default query
