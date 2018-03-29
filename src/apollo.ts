import { ActionsType } from "hyperapp"
import { ApolloClient, ApolloQueryResult, ObservableQuery } from "apollo-client"

export interface State {
  client?: ApolloClient<any>
  modules: {
    [id: string]: {
      result: ApolloQueryResult<any> | null
      observable: ObservableQuery<any> | null
    }
  }
}

export interface Actions {
  init: (data: { id: string; query: any; variables?: any }) => void
  refetch: (data: { id: string; variables?: any }) => void
  setClient: (client: ApolloClient<any>) => void
  modules: {
    setData: (data: { id: string; data: any }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  init: ({ id, query, variables }) => async ({ client, modules }, actions) => {
    if (!modules[id] || !modules[id].observable) {
      if (!client) {
        throw new Error(`Cloud not find "client" in the state`)
      }
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
  setClient: client => ({ client }),
  modules: {
    setData: ({ id, data }) => state => ({
      [id]: {
        ...state[id],
        ...data
      }
    })
  }
}
