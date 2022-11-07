# Data Rambler

An experimental language for a JSON query, transformation and streaming.

## Concept

Data Rambler is a derived from the JSONata language. It extends the powerful query expression syntax with stream declarations. Composing streams dramatically increases the versatility of the expressions and unlocks a whole host of new use cases.

Data Rambler was primarily designed for use in data visualisation; transforming realtime input data for consumption in multiple related visualisations. But it is a generic design that is suitable for many applications.

## Syntax

Data Rambler extends the JSONata syntax for expressions and JSON for data literals. It introduces new syntax for statements on top of the existing expression syntax.

```
let lookup = {
  aaa: 1,
  aba: 2,
  bab: 3
}

in wimp;
in barcoding;

out errors = $append($barcoding.errors, $wimp.errors)
out data = $barcoding.data.values;
```

- All statements represent a stream of values, when referenced by another stream the child stream will subscribe to new values and re-evaluate it's expression for each new value.
- `in` streams allow for data to be pushed into the module by the embedder, `out` streams allow data to be pushed to the embedder.
- `let` streams can be used for static data or intermediate stream processing, and are not visible to the embedder.
- Unlike a variable it's not possible to assign a new value to a stream.
- Any stream that contains static data is effectively a single value that never changes.
- Stream outputs are shared, it will only be evaluated once per input value.
- Streams may subscribe to multiple streams.
- It's possible ( and sometimes useful ) to create cyclical stream subscriptions, use with caution.
- Duplicate values will not be emitted a second time ( shallow equality ).
- When providing a value for an `in` stream it is used as the initial value. If no value is provided then the value is `undefined`.
- Semi-colons are used (optionally) to end a statement.
- It's possible to contain multiple statements in a child scope by placing them with curly braces.

## Differences between data rambler expressions and jsonata

- Ranges can be used outside of arrays `$a := 0..10` instead of `$a := [0..10]`
- Arrays of numbers cannot be used inside predicates `$a [1..3]` or `$a # $i [$i in [1,2,3]]` instead of `$a[ [1,2,3] ]`
- `fn` is used as the keyword for functions instead `function`
- Comma is used as delimiter instead of semi-colons
- Expressions can be listed outside of parentheses

## TODO

- add function signature definition ( inbuilt/function expr ) and validation ( call )
- implement more functions
- add support for more characters to scanner

- investigate error states for token conversion ( test 2/3 )
- function signature validation should coerce values to arrays if required by the function

## COPYRIGHT NOTICE

This parser is derived from the unaffiliated project <https://github.com/shortercode/radiance-parser> under the following license.

> Copyright 2020 Iain Shorter
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The test suite for the expression evaluation is a lightly modified version of the JSONata suite, under the following license.

> MIT license
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
