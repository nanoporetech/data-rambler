import type { Token } from '../scanner/token.type';

export interface ParserContext {
	source: Token[];
	index: number;
	length: number;
}