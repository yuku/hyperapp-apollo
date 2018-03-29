import { ActionsType } from "hyperapp"
import { ApolloClient } from "apollo-client"

import * as query from "./query"

export interface State {
  client?: ApolloClient<any>
  query: query.State
}

export interface Actions {
  initQuery: (data: { id: string; query: any; variables?: any }) => void
  query: query.Actions
}

export const state: State = {
  query: query.state
}

export const actions: ActionsType<State, Actions> = {
  initQuery: ({ id, query, variables }) => ({ client }, actions) => {
    if (!client) {
      throw new Error(`Cloud not find "client" in the state`)
    }
    actions.query.init({ id, query, variables, client })
  },
  query: query.actions
}
