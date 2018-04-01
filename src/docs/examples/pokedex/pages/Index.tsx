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
      render={({ data, loading }) => (
        <div key="index">
          {loading ? (
            <div class="element loading" />
          ) : (
            <div class="columns is-mobile is-multiline">
              {data.pokemons.map(pokemon => (
                <div class="column is-half-mobile is-one-third-tablet is-one-quarter-desktop is-one-fifth-widescreen">
                  <Link to={`/pokemon/${pokemon.name}`}>
                    <Card {...pokemon} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      // TODO: Pagination
      variables={{ first: 151 }}
    />
  </ApplicationLayout>
)
