import { View, VNode } from "hyperapp"

export default function resolveNode<State, Actions>(
  node: VNode<any> | View<State, Actions>,
  state: State,
  actions: Actions
): VNode<any> {
  return typeof node === "function" ? resolveNode(node(state, actions), state, actions) : node
}
