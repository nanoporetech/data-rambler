# Scanner

The scanner takes a string and transforms it into an array of tokens. It's purpose is to produce something easier for the parser to consume than a string or array of characters.

Each token contains:

- value
- type
- start location
- end location

There are 4 types of token:

- identifier
- number
- string
- symbol

Both the string and number token are loosely equivilent to a string/number literal.

An identifier is a word, and can also fulfil the purpose of a keyword. Although wether it is a keyword is contextual and left for the parser.

A symbol is a single symbol character. It is not always desirable for symbols to be grouped depending on the context, hence the scanner leaves them as single tokens. The parser is expected to interpret multiple symbol tokens as a single symbol as appropriate ( such as `>>` which can be read as either a bitshift operator or 2 closing angle brackets depending on the context ).

Whitespace is consumed and discarded by the scanner, although it is theoretically possible to reconstruct most whitespace utilising the row/column information held by each token.
