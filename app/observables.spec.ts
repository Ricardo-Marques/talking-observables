import { reaction, observable } from './observables';

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
