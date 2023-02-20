import { unexpected_end_of_input, unexpected_token, unsupported_escape_sequence } from './error';

describe('syntax errors', () => {
  it('end of input', () => {
    expect(() => unexpected_end_of_input({ row: 1, column: 1})).toThrow('SyntaxError: Unexpected end of input @ line 1.');
  });
  it('unexpected token', () => {
    expect(() => unexpected_token('a token', { row: 2, column: 1})).toThrow('SyntaxError: Invalid or unexpected token "a token" @ line 2.');
  });
  it('unsupported escape sequence', () => {
    expect(() => unsupported_escape_sequence('n', { row: 3, column: 1})).toThrow('SyntaxError: Unsupported escape sequence "\\n" @ line 3.');
  });
});