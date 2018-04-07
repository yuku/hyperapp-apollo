import { h, Component } from "hyperapp"
import gql from "graphql-tag"
import { Link } from "hyperapp-hash-router"

import { Query, QueryRenderProps } from "../../../../../src"

import ApplicationLayout from "../layout/Application"
import Card from "../components/Card"

interface Pokemon {
  id: string
  number: string | null
  name: string | null
  image: string | null
  classification: string | null
}

const GET_POKEMONS = gql`
  query getPokemons($first: Int!) {
    pokemons(first: $first) {
      id
      number
      name
      image
      classification
    }
  }
`

export default () => (
  <ApplicationLayout>
    <Query
      key="index"
      query={GET_POKEMONS}
      render={(params: QueryRenderProps<{ pokemons: Pokemon[] }>) => (
        <div key="index">
          <div class="columns is-mobile is-multiline">
            {params.data.pokemons &&
              params.data.pokemons.map(pokemon => (
                <div class="column is-half-mobile is-one-third-tablet is-one-quarter-desktop is-one-fifth-widescreen">
                  <Link to={`/pokemon/${pokemon.name}`}>
                    <Card {...pokemon} />
                  </Link>
                </div>
              ))}
          </div>
          {params.loading ? (
            <div class="element loading" />
          ) : (
            params.data.pokemons.length < 151 && (
              <div
                key={params.data.pokemons.length}
                class="element loading"
                oncreate={e => {
                  e.onscroll = () => {
                    if (e.getBoundingClientRect().top <= document.documentElement.clientHeight) {
                      params.fetchMore({
                        variables: {
                          first: params.data.pokemons.length + 20
                        },
                        updateQuery: (prev, { fetchMoreResult }) => {
                          if (!fetchMoreResult) {
                            return prev
                          }
                          return {
                            ...prev,
                            pokemons: [...prev.pokemons, ...fetchMoreResult.pokemons.slice(prev.pokemons.length)]
                          }
                        }
                      })
                    }
                  }
                  addEventListener("scroll", e.onscroll)
                }}
                ondestroy={e => {
                  removeEventListener("scroll", e.onscroll)
                }}
              />
            )
          )}
        </div>
      )}
      variables={{ first: 20 }}
      notifyOnNetworkStatusChange={true}
    />
  </ApplicationLayout>
)
