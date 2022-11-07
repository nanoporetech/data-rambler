import { scan } from '../scanner/scanner';
import { consume_token, create_parser_context, ensure_token, match_token, peek_token, previous_token, tokens_remaining } from './parser_context';
import type { ParserContext } from './parser_context.type';

function simple_create_context (source: string): ParserContext {
	const tokens = scan(source);
	return create_parser_context(tokens);
}

describe('parser_context', () => {
	it('peek token', () => {
		const ctx = simple_create_context('a b c');
		expect(peek_token(ctx)).toStrictEqual({
			type: 'identifier',
			start: { column: 1, row: 1 },
			end: { column: 2, row: 1 },
			value: 'a'
		});
		expect(peek_token(ctx, 0)).toStrictEqual({
			type: 'identifier',
			start: { column: 1, row: 1 },
			end: { column: 2, row: 1 },
			value: 'a'
		});
		expect(peek_token(ctx, 1)).toStrictEqual({
			type: 'identifier',
			start: { column: 3, row: 1 },
			end: { column: 4, row: 1 },
			value: 'b'
		});
		expect(peek_token(ctx, 3)).toBeUndefined();
		ctx.index += 1;
		expect(peek_token(ctx, -1)).toStrictEqual({
			type: 'identifier',
			start: { column: 1, row: 1 },
			end: { column: 2, row: 1 },
			value: 'a'
		});
	});
	it('consume token', () => {
		const ctx = simple_create_context('a b');
		expect(consume_token(ctx)).toStrictEqual({
			type: 'identifier',
			start: { column: 1, row: 1 },
			end: { column: 2, row: 1 },
			value: 'a'
		});
		expect(consume_token(ctx)).toStrictEqual({
			type: 'identifier',
			start: { column: 3, row: 1 },
			end: { column: 4, row: 1 },
			value: 'b'
		});
		expect(() => consume_token(ctx)).toThrow('Unexpected end of input.');
	});
	it('tokens remaining', () => {
		const ctx = simple_create_context('a b');
		expect(tokens_remaining(ctx)).toStrictEqual(true);
		ctx.index += 1;
		expect(tokens_remaining(ctx)).toStrictEqual(true);
		ctx.index += 1;
		expect(tokens_remaining(ctx)).toStrictEqual(false);
	});
	it('create parser context', () => {
		expect(simple_create_context('a b')).toStrictEqual({
			source: [
				{
					type: 'identifier',
					start: { column: 1, row: 1 },
					end: { column: 2, row: 1 },
					value: 'a'
				},
				{
					type: 'identifier',
					start: { column: 3, row: 1 },
					end: { column: 4, row: 1 },
					value: 'b'
				}
			],
			index: 0,
			length: 2
		});
	});
	it('match token', () => {
		const ctx = simple_create_context('a + c');
		expect(match_token(ctx, 'identifier')).toBeTruthy();
		expect(match_token(ctx, 'identifier', 'a')).toBeTruthy();
		expect(match_token(ctx, 'identifier', 'b')).toBeFalsy();
		expect(match_token(ctx, 'symbol')).toBeFalsy();
		expect(match_token(ctx, 'symbol', '+', 1)).toBeTruthy();
	});
	it('ensure token', () => {
		const ctx = simple_create_context('a b + c');

		expect(ensure_token(ctx, 'identifier', 'a').value).toEqual('a');
		expect(ensure_token(ctx, 'identifier').value).toEqual('b');
		expect(() => ensure_token(ctx, 'identifier', 'a').value).toThrow('Invalid or unexpected token "+".');
		ctx.index -= 1;
		expect(ensure_token(ctx, 'symbol').value).toEqual('+');
		ctx.index += 1;
		expect(() => ensure_token(ctx, 'identifier')).toThrow('Unexpected end of input.');

	});
	it('previous token', () => {
		const ctx = simple_create_context('a + c');
		expect(() => previous_token(ctx)).toThrow('Unreachable: "previous_token" should not be called if we haven\'t processed any tokens.');
		ctx.index += 1;
		expect(previous_token(ctx)).toStrictEqual({
			type: 'identifier',
			start: { column: 1, row: 1 },
			end: { column: 2, row: 1 },
			value: 'a'
		});
	});
});