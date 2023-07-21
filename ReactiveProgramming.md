# Reactive programming

## What is reactive programming

Reactive programming is the general paradigm behind easily propagating changes in a data stream through the execution of a program. It's not a specific pattern or entity per-se, it's an idea, or style of programming (such as object oriented progamming, functional programming, etc.)

Loosely speaking, it's the concept that when x changes or updates in one location, the things that depend on the value of x are recalculated and updated in various other locations in a non-blocking fashion, without having to tie up threads sitting around just waiting for events to happen.

[Source for the above: https://stackoverflow.com/a/16652921]

I would just reword the last bit - it's the concept that when x changes or updates within a specific code location, the things that depend on the value of x are recalculated and updated in various other locations, without that behavior being explicitly defined in the code location where the change or update occurs.

## WDYM?! Show me the code

Lets use an example of a spreadsheet app. Within that spreadsheet app, we want users to be able to update cells. When a cell is updated, we want to recalculate all the cells that reference that cell.

Using "traditional" imperative programming, we would have to write code that looks something like this

```typescript
function handleTypeInCell(cellCoordinates: {x:number, y: number}, value: string) {
    // update the cell
    updateCell(cellCoordinates, value)
    // recalculate all the cells that reference this cell
    updateCellsWithReferences(cellCoordinates)
}

function updateCellsWithReferences(cellCoordinates: {x: number, y:number}) {
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].references(cellCoordinates)) {
            cells[i].recalculate()
        }
    }
}
```

With reactive programming, we would instead write something like this

```typescript
function handleTypeInCell(cellCoordinates: {x:number, y: number}, value: string) {
    // update the cell
    cells.update(cellCoordinates, value)
    // notice how we're no longer calling updateCellsWithReferences here
}

function updateCellsWithReferences(cellCoordinates: {x: number, y:number}) {
    for (let i = 0; i < cells.length; i++) {
        if (cells.atIndex(i).references(cellCoordinates)) {
            cells.atIndex(i).recalculate()
        }
    }
}

// whenever a cell is updated, recalculate all the cells that reference that cell
cells.subscribe('update', (cellCoordinates: {x:number, y: number}) => {
    updateCellsWithReferences(cellCoordinates)
})
```

The difference here is that we don't have to manually recalculate all the cells that reference the changed cell. Instead, we just subscribe to the cell `update` event, and whenever that event is fired, we recalculate all the cells that reference the changed cell.

## What are the advantages of reactive programming

These are just some of the advantages of reactive programming that I find most compelling, there are many more

### - It lessens cognitive overhead and makes many features easier to implement

Sticking to the same example of a spreadsheet app with imperative style programming, lets say that we wanted to support multiple users editing the same spreadsheet at the same time. Then we also want to have a cell that can poll data from an API on a set interval.

All these extra sources of cell changes would need to be accounted for, and each of them would need to remember to call updateCellsWithReferences.

Then lets say that when a cell is updated, we also need to do something unrelated to the spreadsheet, like update a database. 
We would have a few options:

1) Update the database in the existing `updateCellsWithReferences` function  
    This could become problematic if a dev uses `updateCellsWithReferences` without the intention of storing to the DB
2) Create a new function `updateCellsWithReferencesAndStoreToDB`  
    Then we have to update all the functions that currently call `updateCellsWithReferences` to instead call `updateCellsWithReferencesAndStoreToDB` as needed

With reactive programming, we would subscribe to other users typing, and new data coming in from cells that are polling (just like we would in the imperative example), and instead would call the cell `update` event when those events occur. Then we would add a new subscriber to the cellUpdated event that updates the database.

Note how all the function names remain the same, that we didn't have to update any existing functions, and we didn't have to remember to call any functions other than cell `update`.

### - It gives extreme control over prioritization of events, and the speed at which they are processed

Lets say that we end up with a giant spreadsheet, with hundreds of different poll sources and users typing at the same time. 

We don't want to recalculate all the cells that reference a changed cell every time a cell is updated, this would likely result in a completely blocked UX.

Instead, we can use a concept which is called "backpressure".
Backpressure helps to prevent overload and resource exhaustion in scenarios where the rate of data production exceeds the rate of data consumption.

In our example, we could use backpressure to limit the rate at which the `cellUpdated` event is fired, and therefore limit the rate at which the cells that reference a changed cell are recalculated.

That would look something like this

```typescript
// whenever a cell is updated, recalculate all the cells that reference that cell
cells.subscribe('update', (cellCoordinates: {x:number, y: number}) => {
    updateCellsWithReferences(cellCoordinates)
}, { backpressure: 1000 })
```

To accomplish something similar with imperative programming, we would have to manually implement a queue of events, and then process those events at a set interval. Then we would need to update all the functions that call `updateCellsWithReferences` to instead add the cell coordinates to the queue. Or we would need to update `updateCellsWithReferences` to instead add to the queue, which would be problematic if a dev uses `updateCellsWithReferences` without the intention of adding to the queue (wanting an immediate update).

Backpressure is just one example of the control that reactive programming gives you over the prioritization of events, and the speed at which they are processed.

## Reactive programming vs Observable programming

Observable programming is a specific pattern or design approach commonly found in reactive programming. It is based on the concept of Observables, which are data streams or sources of events. Observables represent a way to observe and react to the emitted values over time. An observable is like a pipeline that produces data, and observers can subscribe to that pipeline to receive and react to the emitted data.

_In the context of observable programming, observables are not only used for events but also for handling streams of data or sequences._

[Source: ChatGPT]

Here's what the example above could look like using my favorite observable programming library, Mobx

```typescript
class Cell {
    @observable value: string = ''
    @observable references: Cell[] = []
    @computed get calculatedValue() {
        if (this.references.length === 0) {
            return this.value
        } else {
            // in this simplified example, we're just adding the values of the referenced cells
            // any further logic to handle formulas etc. would go here, and would look the same
            // in imperative and reactive programming styles
            return this.references.reduce((acc, referencedCell) => {
                return acc + referencedCell.calculatedValue
            }, '')
        }
    }

    @action update(value: string) {
        if (this.references.length === 0) {
            this.value = value
        } else {
            throw new Error('Cannot update a cell that references other cells')
        }
    }
    @action addReference(cell: Cell) {
        this.references.push(cell)
    }
}
```

Initially this may look confusing. 
Some questions that may pop up are:
- What is `@observable`? What is `@computed`? What is `@action`?
- Isn't this extremely non performant? Looks like we're having to recalculate the calculatedValue every time we attempt to get it, which may be many times per second depending on how frequently we want to update the UI!

Lets dive into those questions and try to answer them with some code!
