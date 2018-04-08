# hyperapp-apollo

[![NPM version](http://img.shields.io/npm/v/hyperapp-apollo.svg)](https://www.npmjs.com/package/hyperapp-apollo)
[![Maintainability](https://api.codeclimate.com/v1/badges/ffd3ee558d10c5ac6a7d/maintainability)](https://codeclimate.com/github/yuku-t/hyperapp-apollo/maintainability)

Hyperapp Apollo allows you to fetch data from your GraphQL server and use it in building complex
and reactive UIs using the Hyperapp framework.

## Demo

- [Pokedex](https://yuku-t.com/hyperapp-apollo/examples/pokedex/index.html) - [Source code](https://github.com/yuku-t/hyperapp-apollo/tree/master/src/docs/examples/pokedex)

## Installation

If your project is using npm, you can install [hyperapp-apollo](https://www.npmjs.com/package/hyperapp-apollo) package by npm command:

```bash
# installing the preset package and hyperapp integration
npm install --save hyperapp-apollo apollo-client-preset graphql-tag graphql

# installing each piece independently
npm install --save hyperapp-apollo apollo-client apollo-cache-inmemory apollo-link-http graphql-tag graphql
```

### Distribution files
- **dist/index.js** - The CommonJS version of this package. (default)
- **dist/index.mjs** - The ES Modules version of this package.
- **dist/hyperapp-apollo.js**, **dist/hyperapp-apollo.min.js** - The UMD version of this package. This version exports itself to `window.HyperappApollo`.

## Usage

Add the `apollo` module to your state and actions and start your application.

```js
import { apollo } from "hyperapp-apollo"
import { ApolloClient } from "apollo-client-preset"

const state = {
  apollo: {
    ...apollo.state,
    client: new ApolloClient()
  }
}

const actions = {
  apollo: apollo.actions
}

app(
  state,
  actions,
  (state, actions) => <MyComponent />,
  document.body
)
```

To connect your GraphQL data to your Hyperapp module, use `<Query/>` component:

```js
import { Query } from "hyperapp-apollo"
import gql from "graphql-tag"

const TODO_APP_QUERY = gql`
  query TodoAppQuery($userId: Int!) {
    todos(userId: $userId) {
      id
      text
    }
  }
`

export const TodoApp = ({ userId }) => (
  <Query
    key={`todoApp-${userId}`}
    query={TODO_APP_QUERY}
    variables={{
      userId
    }}
    render={({ data, loading, refetch }) => (
      <div>
        { loading ?
          <div>loading...</div>
        :
          <div>
            <button onclick={refetch}>Refresh</button>
            <ul>
              {data && data.todos && data.todos.map(todo =>
                <li key={todo.id}>{todo.text}</li>
              )}
            </ul>
          </div>
        }
      </div>
    )}
  />
}
```
