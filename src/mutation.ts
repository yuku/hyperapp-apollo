import { h, Component, ActionsType } from "hyperapp"
import { ApolloClient, ApolloError, MutationUpdaterFn } from "apollo-client"
import { GraphQLError } from "graphql"

import * as apollo from "./apollo"
import result from "./util/result"
import omit from "./util/omit"
import { MutationAttributes } from "./types"

export interface MutationModuleState<Data = {}> {
  mutation: any
  data: Data
  errors: GraphQLError[] | null | undefined
  called: boolean
  loading: boolean
  update: MutationUpdaterFn<Data> | undefined
}

export interface State {
  modules: {
    [id: string]: MutationModuleState<any>
  }
  client?: ApolloClient<any>
}

export interface Actions {
  init: (
    data: {
      id: string
      mutation: any
      client: ApolloClient<any>
      update: MutationUpdaterFn<any> | undefined
    }
  ) => void
  destroy: (data: { id: string }) => void
  mutate: (data: { id: string; variables?: any }) => void
  modules: {
    setData: (
      data: { id: string; data: Partial<MutationModuleState<any>> }
    ) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  init: ({
    id,
    mutation,
    client,
    update
  }: {
    id: string
    mutation: any
    client: ApolloClient<any>
    update: MutationUpdaterFn<any>
  }) => (_, actions) => {
    actions.modules.setData({
      id,
      data: {
        mutation,
        update
      }
    })
    return { client }
  },
  destroy: ({ id }) => state => ({
    modules: omit(state.modules, id)
  }),
  mutate: ({ id, variables }: { id: string; variables?: any }) => (
    { client, modules },
    actions
  ) => {
    actions.modules.setData({
      id,
      data: {
        loading: true,
        called: true
      }
    })
    client!
      .mutate({
        mutation: modules[id].mutation,
        variables,
        update: modules[id].update
      })
      .then(result => {
        actions.modules.setData({
          id,
          data: {
            data: result.data,
            errors: result.errors,
            loading: false
          }
        })
      })
      .catch((e: ApolloError) => {
        actions.modules.setData({
          id,
          data: {
            errors: e.graphQLErrors,
            loading: false
          }
        })
        throw e // TODO: onerror
      })
  },
  modules: {
    setData: ({ id, data }: { id: string; data: any }) => state => ({
      [id]: {
        ...state[id],
        ...data
      }
    })
  }
}

let counter = 0

function getRenderProps<Data, Variables>(
  state: State,
  actions: Actions,
  id: string
): MutationAttributes<Data, Variables> {
  const mod = state.modules[id]
  return {
    data: mod && mod.data,
    errors: mod && mod.errors,
    called: mod && mod.called,
    loading: mod && mod.loading,
    execute: ({ variables }: { variables?: Variables }) =>
      actions.mutate({ id, variables })
  }
}

export default function mutation<Data = {}, Variables = {}>(
  mutation: any
): Component<
  {
    key?: string
    render: Component<MutationAttributes<Data, Variables>, any, any>
    update?: MutationUpdaterFn<Data>
  },
  { apollo: apollo.State },
  { apollo: apollo.Actions }
> {
  const tmp = `m${counter++}`
  return ({ render, key, update }) => (
    { apollo: state },
    { apollo: actions }
  ) => {
    const id = key ? `${tmp}[${key}]` : tmp
    const vnode = h(
      render,
      getRenderProps<Data, Variables>(state.mutation, actions.mutation, id)
    )
    const origOncreate = vnode.attributes && (vnode.attributes as any).oncraete
    const origOndestroy =
      vnode.attributes && (vnode.attributes as any).ondestroy
    vnode.attributes = {
      ...vnode.attributes,
      key: id,
      oncreate: (element: HTMLElement) => {
        actions.initMutation<Data>({ id, mutation, update })
        result(origOncreate, element)
      },
      ondestroy: (element: HTMLElement) => {
        result(origOndestroy, element)
      }
    } as any
    return vnode
  }
}
