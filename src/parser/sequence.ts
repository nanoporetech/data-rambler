import { unexpected_end_of_input } from '../scanner/error';
import { consume_token, ensure_token, match_token, tokens_remaining } from './parser_context';

import type { ParserContext } from './parser_context.type';
import type { Sequence } from './sequence.type';

export function parse_sequence<T> (ctx: ParserContext, [prefix, suffix]: [string, string], fn: (_ctx: ParserContext) => T | null): Sequence<T> {
	const elements: T[] = [];
	const { start } = ensure_token(ctx, 'symbol', prefix);
	while (match_token(ctx, 'symbol', suffix) === false) { 
		if (tokens_remaining(ctx) === false) {
			unexpected_end_of_input();
		}
		const element = fn(ctx);
		if (element !== null) {
			elements.push(element);
		}
		if (match_token(ctx, 'symbol', ',') === false) {
			break;
		}
		consume_token(ctx);
	}
	const { end } = ensure_token(ctx, 'symbol', suffix);
	return {
		start,
		end,
		elements,
	};
}