import { h, Component } from "hyperapp"
import gql from "graphql-tag"
import { Link } from "hyperapp-hash-router"

import { query } from "../../../../../src"

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

const Query = query<{
  pokemons: Pokemon[]
}>(GET_POKEMONS)

export default () => (
  <ApplicationLayout>
    <Query
      render={({ data, loading, fetchMore }) => (
        <div key="index">
          <div class="columns is-mobile is-multiline">
            {data &&
              data.pokemons.map(pokemon => (
                <div class="column is-half-mobile is-one-third-tablet is-one-quarter-desktop is-one-fifth-widescreen">
                  <Link to={`/pokemon/${pokemon.name}`}>
                    <Card {...pokemon} />
                  </Link>
                </div>
              ))}
          </div>
          {loading ? (
            <div class="element loading" />
          ) : (
            data.pokemons.length < 151 && (
              <button
                onclick={() => {
                  fetchMore({
                    variables: {
                      first: data.pokemons.length + 20
                    },
                    updateQuery: (prev, { fetchMoreResult }) => {
                      if (!fetchMoreResult) {
                        return prev
                      }
                      return {
                        ...prev,
                        pokemons: [
                          ...prev.pokemons,
                          ...fetchMoreResult.pokemons.slice(
                            prev.pokemons.length
                          )
                        ]
                      }
                    }
                  })
                }}
              >
                Fetch More
              </button>
            )
          )}
        </div>
      )}
      variables={{ first: 20 }}
      notifyOnNetworkStatusChange={true}
    />
  </ApplicationLayout>
)
