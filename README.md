# hyperapp-apollo

Hyperapp Apollo allows you to fetch data from your GraphQL server and use it in building complex
and reactive UIs using the Hyperapp framework.

## Installation

```bash
# installing the preset package and hyperapp integration
npm install --save hyperapp-apollo apollo-client-preset graphql-tag graphql

# installing each piece independently
npm install --save hyperapp-apollo apollo-client apollo-cache-inmemory apollo-link-http graphql-tag graphql
```

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

To connect your GraphQL data to your Hyperapp module, use `graphql()` component enhancer:

```js
import { graphql } from "hyperapp-apollo"
import gql from "graphql-tag"

const TodoApp = ({ apollo: { data, fetching, refetch } }) => (
  <div>
    { fetching ?
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
}

export default graphql(gql`
  query TodoAppQuery {
    todos {
      id
      text
    }
  }
`)(TodoApp)
```