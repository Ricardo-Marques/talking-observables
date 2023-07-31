import { reaction, observable, computed } from './babyMobx';

test('reaction runs when an observable changes and the predicate fn returns true', () => {
    const value = observable(false)

    let reactionRunCount = 0

    const predicateFn = () => value.get()
    const effectFn = () => reactionRunCount++
    reaction(predicateFn, effectFn)

    // initially, the predicate fn returns false, so the reaction does not run    
    expect(reactionRunCount).toBe(0)

    // set the value to true, so the reaction should run
    value.set(true)
    expect(reactionRunCount).toBe(1)

    // set the value to false, the reaction should not run again, since the predicate fn returns false
    value.set(false)
    expect(reactionRunCount).toBe(1)

    // set the value to true, the reaction should run again, since the predicate fn now returns true
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

    // ran once because the predicate fn initially returned true
    expect(reactionRunCount).toBe(1)

    // set the value to true, but the reaction should not run again,
    // since the values of the observables used in the predicate fn did not change
    value.set(true)
    expect(reactionRunCount).toBe(1)
})


test('computed values only recompute when an observable used in its computation changes', () => {
    const usedObservable1 = observable(true)
    const usedObservable2 = observable(true)
    const notUsedObservable = observable(true) // will not be used in the computed value

    let computedRunCount = 0

    function getComputedValue() {
        computedRunCount++
        return usedObservable1.get() && usedObservable2.get()
    }

    const computedValue = computed(getComputedValue)

    computedValue.get()
    expect(computedRunCount).toBe(1)

    usedObservable1.set(false)
    computedValue.get()
    expect(computedRunCount).toBe(2)

    usedObservable1.set(false)
    computedValue.get()
    expect(computedRunCount).toBe(2) // still only computed twice, because usedObservable1 was set to the same value

    notUsedObservable.set(false) // not used in the computed value
    computedValue.get()
    expect(computedRunCount).toBe(2) // still only computed twice
})
