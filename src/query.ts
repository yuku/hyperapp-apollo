import { h, Component } from "hyperapp"
import { ApolloCurrentResult } from "apollo-client"

import { State, Actions } from "./apollo"
import { QueryAttributes } from "./types"

let counter = 0

function getRenderProps<Data, Variables>(
  state: State,
  actions: Actions,
  id: string,
  variables: Variables | undefined
) {
  const currentResult: ApolloCurrentResult<Data> | null | undefined =
    state.modules[id] &&
    state.modules[id].observable &&
    state.modules[id].observable!.currentResult()
  return {
    variables: variables as Variables, // Apollo checks if undefined in runtime
    data:
      currentResult && Object.keys(currentResult.data).length
        ? (currentResult.data as Data)
        : null,
    errors: currentResult && currentResult.errors,
    loading: !!currentResult && currentResult.loading,
    refetch: () => actions.refetch({ id, variables })
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
  { apollo: State },
  { apollo: Actions }
> => {
  const _id = `q${counter++}`
  return ({ variables, render, key }) => (
    { apollo: state },
    { apollo: actions }
  ) => {
    const id = key ? `${_id}[${key}]` : _id
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
        actions.init({ id, query, variables })
        origOncreate && origOncreate(element)
      }
    } as any
    return vnode
  }
}

export default query
