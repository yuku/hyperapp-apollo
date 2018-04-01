import { h } from "hyperapp"
import { Switch, Route, location } from "hyperapp-hash-router"
import ApolloClient from "apollo-boost"

import { apollo } from "../../../../src"

import Index from "./pages/Index"
import Entry from "./pages/Entry"

export const state = {
  apollo: {
    ...apollo.state,
    client: new ApolloClient({
      uri: "https://graphql-pokemon.now.sh/graphql"
    })
  },
  location: location.state
}

export const actions = {
  apollo: apollo.actions,
  location: location.actions,
  getState: () => state => state
}

export const view = (state, actions) => (
  <Switch>
    <Route path="/" render={Index} />
    <Route path="/pokemon/:name" render={Entry} />
  </Switch>
)
