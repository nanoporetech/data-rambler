import { unexpected_end_of_input, unexpected_token, unsupported_escape_sequence } from './error';
import { scan } from './scanner';

describe('syntax errors', () => {
  it('end of input', () => {
    expect(() => unexpected_end_of_input(0, [])).toThrow('SyntaxError: Unexpected end of input @ line 1.');
  });
  it('unexpected token', () => {
    const [ token ] = scan('@');
    expect(() => unexpected_token(token!.value, token!.fragment)).toThrow('SyntaxError: Invalid or unexpected token "a token" @ line 2.');
  });
  it('unsupported escape sequence', () => {
    const [ token ] = scan('"\\un"');
    const fragment = { ...token!.fragment, start: 3, end: 4 };
    expect(() => unsupported_escape_sequence('n', fragment)).toThrow('SyntaxError: Unsupported escape sequence "\\n" @ line 3.');
  });
});