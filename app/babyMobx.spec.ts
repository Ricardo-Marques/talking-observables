import { reaction, observable, computed } from './babyMobx';

test('reaction runs when an observable changes and the predicate fn returns true', () => {
    const value = observable(false)

    let reactionRunCount = 0

    const predicateFn = () => value.get()
    const effectFn = () => reactionRunCount++
    reaction(predicateFn, effectFn)

    expect(reactionRunCount).toBe(0)

    value.set(true)
    expect(reactionRunCount).toBe(1)

    value.set(false)
    expect(reactionRunCount).toBe(1)

    value.set(true)
    expect(reactionRunCount).toBe(2)
})

test('reaction runs immediately when the predicate fn initially returns true', () => {
    const value = observable(true)

    let reactionRunCount = 0

    const predicateFn = () => value.get()
    const effectFn = () => reactionRunCount++
    reaction(predicateFn, effectFn)

    expect(reactionRunCount).toBe(1)
})

test('reaction does not run if the observables used in the predicate fn do not change, even if their setter is called', () => {
    const value = observable(true)

    let reactionRunCount = 0

    const predicateFn = () => value.get()
    const effectFn = () => reactionRunCount++
    reaction(predicateFn, effectFn)

    expect(reactionRunCount).toBe(1)

    value.set(true)
    expect(reactionRunCount).toBe(1)
})


test('computed values only recompute when an observable used in its computation changes', () => {
    const value1 = observable(true)
    const value2 = observable(true)
    const value3 = observable(true) // will not be used in the computed value

    let computedRunCount = 0

    const computedValue = computed(() => {
        computedRunCount++
        return value1.get() && value2.get()
    })

    computedValue.get()
    expect(computedRunCount).toBe(1)

    value1.set(false)
    computedValue.get()
    expect(computedRunCount).toBe(2)

    value1.set(false)
    computedValue.get()
    expect(computedRunCount).toBe(2) // still only computed twice, even though value1 was set to false twice

    value3.set(false) // not used in the computed value
    computedValue.get()
    expect(computedRunCount).toBe(2) // still only computed twice
})
