import { create_parser_context, tokens_remaining } from './parser_context';
import { parse_statement } from './statement';

import type { Token } from '../scanner/token.type';
import type { Position } from '../scanner/Position.type';
import type { Module, Statement } from './expression.type';

export function parse(tokens: Token[]): Module {
	const ctx = create_parser_context(tokens);
	const statements: Statement[] = []; 

	while (tokens_remaining(ctx)) {
		statements.push(parse_statement(ctx));
	}

	if (statements.length === 0) {
		const pos: Position = {
			column: 1, row: 1
		};
		return { type: 'module', start: pos, end: pos, statements };
	}
	else {
		const start = statements[0].start;
		const end = statements[statements.length - 1].end;
		return { type: 'module', start, end, statements };
	}
}