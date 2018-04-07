import { Component, ActionsType } from "hyperapp"
import { DocumentNode } from "graphql"
import { FetchResult } from "apollo-link"
import ApolloClient, { ApolloError, PureQueryOptions, MutationUpdaterFn } from "apollo-client"

import { OperationVariables, RefetchQueriesProviderFn } from "./types"
import * as apollo from "./apollo"
import addLifeCycleHandlers from "./util/addLifeCycleHandlers"
import omit from "./util/omit"
import resolveNode from "./util/resolveNode"
import setData from "./util/setData"

export interface MutationResult<Data = Record<string, any>> {
  called: boolean
  data?: Data
  error?: ApolloError
  loading: boolean
}

export interface MutationOptions<Data = any, Variables = OperationVariables> {
  optimisticResponse?: object
  refetchQueries?: string[] | PureQueryOptions[] | RefetchQueriesProviderFn
  update?: MutationUpdaterFn<Data>
  variables?: Variables
}

export declare type MutationFn<Data = any, Variables = OperationVariables> = (
  options?: MutationOptions<Data, Variables>
) => Promise<void | FetchResult<Data>>

export interface MutationProps<Data = any, Variables = OperationVariables> {
  ignoreResults?: boolean
  key: string // Globally unique key
  mutation: DocumentNode
  onCompleted?: (data: Data) => void
  onError?: (error: ApolloError) => void
  optimisticResponse?: object
  refetchQueries?: string[] | PureQueryOptions[] | RefetchQueriesProviderFn
  render: Component<RenderProps<Data, Variables>, any, any>
  update?: MutationUpdaterFn<Data>
  variables?: Variables
}

export declare type RenderProps<Data, Variables> = MutationResult<Data> & {
  runMutation: (options?: MutationOptions<Data, Variables>) => void
}

export interface MutationModuleState<Data = any> {
  called: boolean
  data?: Data
  error?: ApolloError
  loading: boolean
}

// globalState.apollo.mutation
export interface State {
  modules: {
    [id: string]: MutationModuleState<any>
  }
  client?: ApolloClient<any>
}

// wiredActions.apollo.mutation
export interface Actions {
  initialize: (params: { props: MutationProps<any, any>; client: ApolloClient<any> }) => void
  mutate: (params: { props: MutationProps<any, any>; options: MutationOptions<any> }) => Promise<FetchResult>
  onStartMutation: (params: MutationProps<any, any>) => void
  onCompletedMutation: (params: { props: MutationProps<any, any>; response: FetchResult }) => void
  onMutationError: (params: { props: MutationProps<any, any>; error: ApolloError }) => void
  destroy: (key: string) => void
  modules: {
    setData: (data: { key: string; data: Partial<MutationModuleState<any>> }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  initialize: params => ({ client: params.client }),
  mutate: (params: { props: MutationProps<any, any>; options: MutationOptions<any> }) => state => {
    const { mutation, variables, optimisticResponse, update } = params.props
    const refetchQueries = params.options.refetchQueries || params.props.refetchQueries
    return state.client!.mutate({
      mutation,
      variables,
      optimisticResponse,
      refetchQueries,
      update,
      ...params.options
    })
  },
  onStartMutation: (params: MutationProps) => state => {
    const moduleState = state.modules[params.key]
    if (!moduleState.loading && !params.ignoreResults) {
      return {
        loading: true,
        error: undefined,
        data: undefined,
        called: true
      }
    }
  },
  onCompletedMutation: (params: { props: MutationProps<any, any>; response: FetchResult }) => {
    if (params.props.ignoreResults) {
      return
    }
    const onCompleted = params.props.onCompleted
    if (onCompleted) {
      onCompleted(params.response.data)
    }
  },
  onMutationError: (params: { props: MutationProps<any, any>; error: ApolloError }) => {
    const onError = params.props.onError
    if (onError) {
      onError(params.error)
    }
  },
  destroy: (key: string) => state => ({ modules: omit(state.modules, key) }),
  modules: {
    setData
  }
}

function getRenderProps<Data, Variables>(
  props: MutationProps<Data, Variables>,
  state: MutationModuleState<Data>,
  actions: Actions
): RenderProps<Data, Variables> {
  return {
    called: state.called,
    loading: state.loading,
    data: state.data,
    error: state.error,
    runMutation: (options?: MutationOptions<Data, Variables>) => {
      actions.onStartMutation(props)
      return actions
        .mutate({ props, options: options || {} })
        .then(response => {
          actions.onCompletedMutation({
            props,
            response
          })
          return response
        })
        .catch(error => {
          actions.onMutationError({ props, error })
          if (!props.onError) {
            throw error
          }
        })
    }
  }
}

export function Mutation<Data = any, Variables = OperationVariables>(
  props: MutationProps<Data, Variables>,
  children: any
) {
  return (state: { apollo: apollo.State }, actions: { apollo: apollo.Actions }) => {
    const moduleState: MutationModuleState<Data> | void = state.apollo.mutation.modules[props.key]
    if (!moduleState) {
      actions.apollo.initMutation(props)
      return
    }
    const vnode = resolveNode(
      props.render(getRenderProps(props, moduleState, actions.apollo.mutation), children),
      state,
      actions
    )
    vnode.attributes = addLifeCycleHandlers(
      {
        ...vnode.attributes,
        key: props.key
      },
      {
        ondestroy() {
          actions.apollo.mutation.destroy(props.key)
        }
      }
    )
  }
}
