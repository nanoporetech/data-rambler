import type { Expression } from './expression.type';
import type { ParserContext } from './parser_context.type';

// export type TokenPattern = TokenTypes | `${TokenTypes}:${string}`;
export type TokenPattern = string;

export type PrefixParselet = (_ctx: ParserContext, _precedence: number) => Expression;
export type InfixParselet = (_ctx: ParserContext, _left: Expression, _precedence: number) => Expression;

export interface ParseletInfo<T extends (InfixParselet | PrefixParselet)> {
	parselet: T;
	precedence: number;
}

export type InfixParseletTrieNode = {
	parselet_info?: ParseletInfo<InfixParselet>;
	children?: Map<TokenPattern, InfixParseletTrieNode>;
};

export type PrefixParseletTrieNode = ParseletInfo<PrefixParselet>;