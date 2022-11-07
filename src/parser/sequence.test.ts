import { scan } from '../scanner/scanner';
import { consume_token, create_parser_context } from './parser_context';
import type { ParserContext } from './parser_context.type';
import { parse_sequence } from './sequence';

function simple_create_context (source: string): ParserContext {
	const tokens = scan(source);
	return create_parser_context(tokens);
}

describe('parse sequence', () => {
	it('throws with no tokens', () => {
		expect(
			() => parse_sequence(
				simple_create_context(''),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toThrow('Unexpected end of input.');
	});
	it('accepts an empty sequence', () => {
		expect(
			parse_sequence(
				simple_create_context('()'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 3, row: 1},
			elements: [],
		});
	});
	it('accepts identical prefix/suffix', () => {
		expect(
			parse_sequence(
				simple_create_context('||'),
				['|', '|'],
				ctx => consume_token(ctx)
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 3, row: 1},
			elements: [],
		});
	});
	it('accepts single element', () => {
		expect(
			parse_sequence(
				simple_create_context('(a)'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 4, row: 1},
			elements: [{
				type: 'identifier',
				value: 'a',
				start: { column: 2, row: 1},
				end: { column: 3, row: 1}
			}],
		});
	});
	it('accepts multiple elements', () => {
		expect(
			parse_sequence(
				simple_create_context('(a, b,c )'), // purposefully odd whitespace
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 10, row: 1},
			elements: [{
				type: 'identifier',
				value: 'a',
				start: { column: 2, row: 1},
				end: { column: 3, row: 1}
			},
			{
				type: 'identifier',
				value: 'b',
				start: { column: 5, row: 1},
				end: { column: 6, row: 1}
			},
			{
				type: 'identifier',
				value: 'c',
				start: { column: 7, row: 1},
				end: { column: 8, row: 1}
			}],
		});
	});
	it('throws when only prefix', () => {
		expect(
			() => parse_sequence(
				simple_create_context('('),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toThrow('Unexpected end of input.');
	});
	it('throws when no suffix', () => {
		expect(
			() => parse_sequence(
				simple_create_context('(a,b,c'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toThrow('Unexpected end of input.');
	});
	it('throws when incorrect prefix/suffix', () => {
		expect(
			() => parse_sequence(
				simple_create_context('{'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toThrow('Invalid or unexpected token "{".');
		expect(
			() => parse_sequence(
				simple_create_context('(a}'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toThrow('Invalid or unexpected token "}".');
	});
	it('throws when no comma', () => {
		expect(
			() => parse_sequence(
				simple_create_context('(a b)'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toThrow('Invalid or unexpected token "b".');
	});
	it('allows trailing comma', () => {
		expect(
			parse_sequence(
				simple_create_context('(a,)'),
				['(', ')'],
				ctx => consume_token(ctx)
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 5, row: 1},
			elements: [{
				type: 'identifier',
				value: 'a',
				start: { column: 2, row: 1},
				end: { column: 3, row: 1}
			}],
		});
	});
	it('allows nested sequence', () => {
		expect(
			parse_sequence(
				simple_create_context('((a))'),
				['(', ')'],
				ctx => parse_sequence(
					ctx,
					['(', ')'],
					ctx => consume_token(ctx)
				)
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 6, row: 1},
			elements: [{
				start: { column: 2, row: 1},
				end: { column: 5, row: 1},
				elements: [{
					type: 'identifier',
					value: 'a',
					start: { column: 3, row: 1},
					end: { column: 4, row: 1}
				}],
			}],
		});
	});
	it('ignores null elements', () => {
		const results = [null, 'a', null, 'b'];
		expect(
			parse_sequence(
				simple_create_context('(1,2,3,4)'),
				['(', ')'],
				ctx => {
					consume_token(ctx);
					return results.shift();
				}
			)
		).toStrictEqual({
			start: { column: 1, row: 1},
			end: { column: 10, row: 1},
			elements: ['a', 'b'],
		});
	});
});