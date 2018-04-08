import { h, Component } from "hyperapp"
import gql from "graphql-tag"
import { Link } from "hyperapp-hash-router"

import { Query, QueryRenderProps } from "../../../../../src"

import ApplicationLayout from "../layout/Application"
import Card from "../components/Card"

interface Attack {
  name: string
  type: string
  damage: number
}

interface PokemonAttack {
  fast: Attack[]
  special: Attack[]
}

interface PokemonDimension {
  minimum: string
  maximum: string
}

interface Pokemon {
  id: string
  name: string
  number: string
  image: string
  types: string[]
  weaknesses: string[]
  height: PokemonDimension
  weight: PokemonDimension
  classification: string
  resistant: string[]
  attacks: PokemonAttack
  evolutions: {
    id: string
    name: string
    number: string
    image: string
  }[]
}

const GET_POKEMON = gql`
  query getPokemon($name: String!) {
    pokemon(name: $name) {
      id
      name
      number
      image
      types
      classification
      resistant
      weaknesses
      height {
        minimum
        maximum
      }
      weight {
        minimum
        maximum
      }
      attacks {
        fast {
          name
          type
          damage
        }
        special {
          name
          type
          damage
        }
      }
      evolutions {
        id
        name
        number
        image
      }
    }
  }
`

export default ({ match }) => (
  <ApplicationLayout>
    <Query
      key="entry"
      query={GET_POKEMON}
      render={(params: QueryRenderProps<{ pokemon: Pokemon }>) => (
        <div key="entry">
          {params.loading ? (
            <div class="element loading" />
          ) : (
            <div class="columns is-centered">
              <div class="column is-three-quarters-tablet is-two-thirds-desktop is-half-widescreen">
                <nav class="breadcrumb">
                  <ul>
                    <li>
                      <Link to="/">Index</Link>
                    </li>
                    <li class="is-active">
                      <Link to={match.url}>{params.data.pokemon.name}</Link>
                    </li>
                  </ul>
                </nav>
                <div class="columns">
                  <div class="column">
                    <Card {...params.data.pokemon} />
                  </div>
                  <div class="column">
                    <h4 class="subtitle is-4">Types</h4>
                    <div class="tags">{params.data.pokemon.types.map(type => <span class="tag">{type}</span>)}</div>
                    <h4 class="subtitle is-4">Weaknesses</h4>
                    <div class="tags">
                      {params.data.pokemon.weaknesses.map(type => <span class="tag">{type}</span>)}
                    </div>
                    <h4 class="subtitle is-4">Resistant</h4>
                    <div class="tags">{params.data.pokemon.resistant.map(type => <span class="tag">{type}</span>)}</div>
                  </div>
                </div>
                <div>
                  <h4 class="title is-4">Attacks</h4>
                  <table class="table is-fullwidth is-hoverable">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Damage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {params.data.pokemon.attacks.fast.map(attack => (
                        <tr>
                          <td>{attack.name}</td>
                          <td>{attack.type}</td>
                          <td>{attack.damage}</td>
                        </tr>
                      ))}
                      {params.data.pokemon.attacks.special.map(attack => (
                        <tr>
                          <td>{attack.name}</td>
                          <td>{attack.type}</td>
                          <td>{attack.damage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 class="title is-4">Evolutions</h4>
                  {params.data.pokemon.evolutions ? (
                    params.data.pokemon.evolutions.map(pokemon => (
                      <Link to={`/pokemon/${pokemon.name}`} class="media">
                        <figure
                          class="media-left"
                          style={{
                            width: "64px"
                          }}
                        >
                          <img src={pokemon.image} alt={pokemon.name} />
                        </figure>
                        <div class="media-content">
                          <h5 class="title is-5">
                            {pokemon.number} - {pokemon.name}
                          </h5>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p>No evolution</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      variables={{ name: match.params.name }}
    />
  </ApplicationLayout>
)
