// record of all registered observables (using a unique id as the key)
// as the value, an array of unique ids of all the reactions that are observing that observable
const observables: Record<number, Array<number>> = {}
const reactionSchedulers: Record<number, () => void> = {}
const recomputeSchedulers: Record<number, () => void> = {}

let fnIdBeingExecuted: number | null = null

// takes a predicateFn that returns a boolean, and an effectFn that is executed when the predicateFn returns true
// when the observables used in the predicateFn change, the predicateFn is called again, and if it returns true,
// the effectFn is executed
export const reaction = (predicateFn: () => boolean, effectFn: () => void) => {
  const guid = getGuid()

  const predicateFnWrapper = () => {
    fnIdBeingExecuted = guid
    const result = predicateFn()
    fnIdBeingExecuted = null
    return result
  }


  function schedule() {
    if (predicateFnWrapper()) {
      effectFn()
    }
  }

  schedule()

  reactionSchedulers[guid] = schedule
}

export const observable = (initialValue: any) => {
  const guid = getGuid()
  observables[guid] = []

  let value = initialValue

  const get = () => {
    if (fnIdBeingExecuted) {
      if (!observables[guid].includes(fnIdBeingExecuted)) {
        observables[guid].push(fnIdBeingExecuted)
      }
    } else {
      console.warn('get() was called outside of a reaction')
    }

    return value
  }

  const set = (newValue: any) => {
    if (newValue !== value) {
      value = newValue
      observables[guid].forEach(fnId => {
        reactionSchedulers[fnId]?.()
        recomputeSchedulers[fnId]?.()
      })
    }
  }

  return { get, set }
}

export const computed = (getterFn: () => any) => {
  const guid = getGuid()
  observables[guid] = []

  let value: any = null

  const getterWrapper = () => {
    fnIdBeingExecuted = guid
    const result = getterFn()
    fnIdBeingExecuted = null
    return result
  }

  value = getterWrapper()

  const get = () => {
    return value
  }


  function scheduleRecompute() {
      value = getterWrapper()
  }

  recomputeSchedulers[guid] = scheduleRecompute

  return { get }
}


let guid = 0

function getGuid() {
  return guid++
}
