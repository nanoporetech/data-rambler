import type { TokenTypes } from '../scanner/token.type';
import type { TokenPattern } from './parser.type';

export function read_token_pattern (pattern: TokenPattern): { type: TokenTypes, value?: string} {
	const i = pattern.indexOf(':');

	if (i > -1) {
		const type = pattern.slice(0, i) as TokenTypes;
		const value = pattern.slice(i + 1);
		return { type, value };
	}

	const type = pattern as TokenTypes;
	return { type };
}