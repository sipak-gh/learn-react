// JSX is sugar for jsx() calls. Call jsx() by hand and look at what it returns.
import { jsx, jsxs } from 'react/jsx-runtime'

const heading = jsx('h1', { className: 'title', children: 'Five Dice' })
console.log(heading)

const second = jsx('li', { children: 'two' }, 'b') // the third argument is the key
const list = jsxs('ul', { children: [jsx('li', { children: 'one' }, 'a'), second] })
console.log(list.type, list.key)
console.log(second)
