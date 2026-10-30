const values = [3, 6, 3, 1, 3]

// reduce folds a list into one value, here a total. It doesn't change `values`.
console.log('reduce  ', values.reduce((sum, v) => sum + v, 0))

// Copying versions of the classic mutators: a sorted copy, a copy with one element replaced.
const sorted = values.toSorted((a, b) => a - b)
console.log('toSorted', sorted, values)
const changed = values.with(0, 6)
console.log('with    ', changed, values)

// sort() MUTATES the array, and returns the same array.
const mutated = values.sort((a, b) => a - b)
console.log('sort    ', mutated, values, mutated === values)

// Without a compare function, sort() compares the values as strings.
console.log('gotcha  ', [10, 9, 1].toSorted())
