import { h, Component } from "hyperapp"
import { ApolloCurrentResult } from "apollo-client"

import { State, Actions } from "./apollo"
import { QueryAttributes } from "./types"

let counter = 0

function getRenderProps<Data, Variables>(
  state: State,
  actions: Actions,
  id: string,
  variables: Variables
) {
  const currentResult: ApolloCurrentResult<Data> | null | undefined =
    state.modules[id] &&
    state.modules[id].observable &&
    state.modules[id].observable!.currentResult()
  return {
    variables,
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
    variables: Variables
    render: Component<QueryAttributes<Data, Variables>, any, any>
  },
  { apollo: State },
  { apollo: Actions }
> => {
  const id = `m${counter++}`
  return ({ variables, render }) => ({ apollo: state }, { apollo: actions }) =>
    h(
      "apollo-query",
      {
        key: id,
        oncreate: () => actions.init({ id, query, variables })
      },
      [
        h(
          render,
          getRenderProps<Data, Variables>(state, actions, id, variables),
          []
        )
      ]
    )
}

export default query
