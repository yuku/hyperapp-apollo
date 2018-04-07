import { ActionsType } from "hyperapp"
import { ApolloClient, MutationUpdaterFn } from "apollo-client"

import * as query from "./query"
import * as mutation from "./mutation"

export interface State {
  client?: ApolloClient<any>
  query: query.State
  mutation: mutation.State
}

export interface Actions {
  initQuery: (props: query.QueryProps<any, any>) => void
  initMutation: <Data>(
    data: {
      id: string
      mutation: any
      update: MutationUpdaterFn<Data> | undefined
    }
  ) => void
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
  initMutation: ({
    id,
    mutation,
    update
  }: {
    id: string
    mutation: any
    update: MutationUpdaterFn | undefined
  }) => ({ client }, actions) => {
    actions.mutation.init({ id, mutation, client: getClient(client), update })
  },
  query: query.actions,
  mutation: mutation.actions
}
