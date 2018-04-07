import { ActionsType } from "hyperapp"
import { ApolloClient } from "apollo-client"

import * as query from "./Query"
import * as mutation from "./Mutation"

export interface State {
  client?: ApolloClient<any>
  query: query.State
  mutation: mutation.State
}

export interface Actions {
  initQuery: (props: query.QueryProps<any, any>) => void
  initMutation: (props: mutation.MutationProps<any, any>) => void
  query: query.Actions
  mutation: mutation.Actions
}

export const state: State = {
  query: query.state,
  mutation: mutation.state
}

function getClient(client: ApolloClient<any> | undefined): ApolloClient<any> {
  if (!client) {
    throw new Error(`Cloud not find "client" in the state`)
  }
  return client
}

export const actions: ActionsType<State, Actions> = {
  initQuery: (props: query.QueryProps<any, any>) => ({ client }, actions) => {
    actions.query.initializeQueryObservable({
      props,
      client: getClient(client)
    })
  },
  initMutation: (props: mutation.MutationProps<any, any>) => ({ client }, actions) => {
    actions.mutation.initialize({
      props,
      client: getClient(client)
    })
  },
  query: query.actions,
  mutation: mutation.actions
}
