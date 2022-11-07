import { unexpected_end_of_input, unexpected_token, unsupported_escape_sequence } from './error';

describe('syntax errors', () => {
	it('end of input', () => {
		expect(() => unexpected_end_of_input()).toThrow('SyntaxError: Unexpected end of input.');
	});
	it('unexpected token', () => {
		expect(() => unexpected_token('a token')).toThrow('SyntaxError: Invalid or unexpected token "a token".');
	});
	it('unsupported escape sequence', () => {
		expect(() => unsupported_escape_sequence('n')).toThrow('SyntaxError: Unsupported escape sequence "\\n".');
	});
});