function compose(orig: any, newHandler: any) {
  return orig
    ? (...args: any[]) => {
        newHandler(...args)
        orig(...args)
      }
    : newHandler
}

export default function addLifeCycleHandlers(
  attributes: any,
  {
    oncreate,
    onupdate,
    onremove,
    ondestroy
  }: {
    oncreate?: (element: HTMLElement) => void
    onupdate?: (element: HTMLElement, oldAttributes: any) => void
    onremove?: (element: HTMLElement) => void
    ondestroy?: (element: HTMLElement) => void
  }
): any {
  if (oncreate) {
    attributes.oncreate = compose(attributes.oncreate, oncreate)
  }
  if (onupdate) {
    attributes.onupdate = compose(attributes.onupdate, onupdate)
  }
  if (onremove) {
    attributes.onremove = compose(attributes.onremove, onremove)
  }
  if (ondestroy) {
    attributes.ondestroy = compose(attributes.ondestroy, ondestroy)
  }
  return attributes
}
