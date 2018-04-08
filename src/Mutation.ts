import { Component, ActionsType, VNode } from "hyperapp"
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

export interface MutationState<Data = any> {
  called: boolean
  data?: Data
  error?: ApolloError
  loading: boolean
}

export interface MutationLocals<Data, Variables> {
  hasMounted: boolean
  mostRecentMutationId: number
  props: MutationProps<Data, Variables>
}

const locals: {
  [key: string]: MutationLocals<any, any>
} = {}

// globalState.apollo.mutation
export interface State {
  modules: {
    [id: string]: MutationState<any>
  }
  client?: ApolloClient<any>
}

// wiredActions.apollo.mutation
export interface Actions {
  initialize: (params: { props: MutationProps<any, any>; client: ApolloClient<any> }) => void
  mutate: (params: { props: MutationProps<any, any>; options: MutationOptions<any> }) => Promise<FetchResult>
  onStartMutation: (params: MutationProps<any, any>) => void
  onCompletedMutation: (params: { props: MutationProps<any, any>; response: FetchResult; mutationId: number }) => void
  onMutationError: (params: { props: MutationProps<any, any>; error: ApolloError; mutationId: number }) => void
  destroy: (key: string) => void
  modules: {
    setData: (data: { key: string; data: Partial<MutationState<any>> }) => void
  }
}

export const state: State = {
  modules: {}
}

export const actions: ActionsType<State, Actions> = {
  initialize: (params: { props: MutationProps<any, any>; client: ApolloClient<any> }) => (_, actions) => {
    locals[params.props.key] = {
      hasMounted: false,
      mostRecentMutationId: 0,
      props: params.props
    }
    actions.modules.setData({
      key: params.props.key,
      data: {
        loading: false,
        called: false,
        error: undefined,
        data: undefined
      }
    })
    return {
      client: params.client
    }
  },
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
    const mutationState = state.modules[params.key]
    if (!mutationState.loading && !params.ignoreResults) {
      return {
        loading: true,
        error: undefined,
        data: undefined,
        called: true
      }
    }
  },
  onCompletedMutation: (params: { props: MutationProps<any, any>; response: FetchResult; mutationId: number }) => {
    const { onCompleted, ignoreResults } = params.props
    const data = params.response.data
    const callOnCompleted = () => (onCompleted ? onCompleted(data) : null)
    if (isMostRecentMutation(params.props.key, params.mutationId) && !ignoreResults) {
      setTimeout(callOnCompleted, 10) // huristic
      return {
        loading: false,
        data
      }
    } else {
      callOnCompleted()
    }
  },
  onMutationError: (params: { props: MutationProps<any, any>; error: ApolloError; mutationId: number }) => {
    const onError = params.props.onError
    const callOnError = () => (onError ? onError(params.error) : null)
    if (isMostRecentMutation(params.props.key, params.mutationId)) {
      setTimeout(callOnError, 10) // huristic
      return {
        loading: false,
        error: params.error
      }
    } else {
      callOnError()
    }
  },
  destroy: (key: string) => state => ({ modules: omit(state.modules, key) }),
  modules: {
    setData
  }
}

function generateNewMutationId(key: string) {
  locals[key].mostRecentMutationId = locals[key].mostRecentMutationId + 1
  return locals[key].mostRecentMutationId
}

function isMostRecentMutation(key: string, mutationId: number) {
  return locals[key].mostRecentMutationId === mutationId
}

function getRenderProps<Data, Variables>(
  props: MutationProps<Data, Variables>,
  state: MutationState<Data>,
  actions: Actions
): RenderProps<Data, Variables> {
  return {
    called: state.called,
    loading: state.loading,
    data: state.data,
    error: state.error,
    runMutation: (options?: MutationOptions<Data, Variables>) => {
      actions.onStartMutation(props)
      const mutationId = generateNewMutationId(props.key)
      return actions
        .mutate({ props, options: options || {} })
        .then(response => {
          actions.onCompletedMutation({
            props,
            response,
            mutationId
          })
          return response
        })
        .catch(error => {
          actions.onMutationError({ props, error, mutationId })
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
    const mutationState: MutationState<Data> | void = state.apollo.mutation.modules[props.key]
    if (!mutationState) {
      actions.apollo.initMutation(props)
      return
    }
    const vnode = resolveNode(
      props.render(getRenderProps(props, mutationState, actions.apollo.mutation), children),
      state,
      actions
    )
    vnode.attributes = addLifeCycleHandlers(
      {
        ...vnode.attributes,
        key: props.key
      },
      {
        oncreate() {
          locals[props.key].hasMounted = true
        },
        ondestroy() {
          actions.apollo.mutation.destroy(props.key)
        }
      }
    )
    locals[props.key].props = props
    return vnode
  }
}
