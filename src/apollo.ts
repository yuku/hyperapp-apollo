import { ActionsType } from "hyperapp"
import { ApolloClient } from "apollo-client"

import ApolloProp from "./ApolloProp"

export interface State {
  client?: ApolloClient<any>
  modules: {
    [id: string]: {
      data: ApolloProp["data"]
      errors: ApolloProp["errors"]
      fetching: ApolloProp["fetching"]
    }
  }
}

export interface Actions {
  fetch: (data: { id: string; ast: any }) => void
  setClient: (client: ApolloClient<any>) => void
  modules: {
    setData: (data: { id: string; data: any }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  fetch: ({ id, ast }) => async ({ client }, actions) => {
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
      const data = await client.query({ query: ast })
      actions.modules.setData({ id, data })
    } catch (error) {
      window.console.error(error)
    }
  },
  setClient: client => ({ client }),
  modules: {
    setData: ({ id, data }) => ({
      [id]: {
        data: data.data,
        errors: data.errors,
        fetching: false
      }
    })
  }
}
