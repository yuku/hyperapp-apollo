import { ActionsType } from "hyperapp"
import { ApolloClient } from "apollo-client"

import ApolloProp from "./ApolloProp"

export interface State {
  client?: ApolloClient<any>
  modules: {
    [id: string]: Pick<ApolloProp, "data" | "errors" | "fetching">
  }
}

export interface Actions {
  fetch: (data: { id: string; query: any; variables?: any }) => void
  setClient: (client: ApolloClient<any>) => void
  modules: {
    setData: (data: { id: string; data: any }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  fetch: ({ id, query, variables }) => async ({ client }, actions) => {
    if (!client) {
      throw new Error("Missing ApolloClient")
    }
    actions.modules.setData({
      id,
      data: {
        data: null,
        errors: null,
        fetching: true
      }
    })
    try {
      const response = await client.query({ query, variables })
      actions.modules.setData({
        id,
        data: {
          data: response.data,
          errors: response.errors,
          fetching: false
        }
      })
    } catch (error) {
      window.console.error(error)
    }
  },
  setClient: client => ({ client }),
  modules: {
    setData: ({ id, data }) => ({
      [id]: data
    })
  }
}
