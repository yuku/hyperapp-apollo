import { h, Component } from "hyperapp"

import { State, Actions } from "./apollo"
import ApolloProp from "./ApolloProp"

let counter = 0

const query = <Data = {}>(
  query: any
): Component<
  {
    variables: { [name: string]: any }
    render: Component<ApolloProp<Data>, any, any>
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
        oncreate: () => actions.fetch({ id, query, variables })
      },
      [
        h(
          render,
          {
            ...(state.modules[id] || {
              data: null,
              errors: null,
              fetching: false
            }),
            refetch: () => actions.fetch({ id, query, variables })
          },
          []
        )
      ]
    )
}

export default query
