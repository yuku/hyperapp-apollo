import { app } from "hyperapp"
import { location } from "hyperapp-hash-router"

import { state, actions, view } from "./app"

const appActions = app(state, actions, view, document.getElementById("app"))
location.subscribe(appActions.location)
;(window as any).appActions = appActions
