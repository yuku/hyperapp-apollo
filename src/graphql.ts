import { h, Component } from "hyperapp"

import { State, Actions } from "./apollo"

let counter = 0

export default (ast: any) => {
  const id = `c${counter++}`
  return (
    WrappedComponent: any
  ): Component<any, { apollo: State }, { apollo: Actions }> => (
    props: any,
    children: any
  ) => ({ apollo: { modules: { [id]: state } } }, { apollo: actions }) => {
    return h(
      "hyperapp-apollo",
      {
        oncreate: () => actions.fetch({ id, ast })
      },
      [
        WrappedComponent(
          {
            ...props,
            apollo: {
              ...state,
              refetch: () => actions.fetch({ id, ast })
            }
          },
          children
        )
      ]
    )
  }
}
