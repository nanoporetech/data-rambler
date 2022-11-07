import { consume_token, create_parser_context } from './parser_context';
import type { ParserContext } from './parser_context.type';
import { end_statement, parse_statement, should_end_statement } from './statement';
import { scan } from '../scanner/scanner';

function simple_create_context (source: string): ParserContext {
	const tokens = scan(source);
	return create_parser_context(tokens);
}

describe('statement', () => {
	it('parsing statement with no tokens produces end of input', () => {
		const ctx = simple_create_context('');
		expect(() => parse_statement(ctx)).toThrow('Unexpected end of input.');
	});
	it('end statement produces unexpected token if no newline/eof/semicolon', () => {
		const ctx = simple_create_context('0 0');
		consume_token(ctx); // MUST have a previous token
		expect(() => {
			end_statement(ctx);
		}).toThrow('Invalid or unexpected token "0".');
	});
	it('semicolon indicates should end statement', () => {
		const ctx = simple_create_context(';');
		expect(should_end_statement(ctx)).toEqual(true);
	});
});
