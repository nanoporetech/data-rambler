import type { Position } from './Position.type';

export type TokenTypes = 'identifier' | 'symbol' | 'number' | 'string';

export interface Token {
  readonly type: TokenTypes;
  readonly start: Position;
  readonly end: Position;
  readonly value: string;
}

export interface IdentifierToken extends Token {
  readonly type: 'identifier';
}

export interface SymbolToken extends Token {
  readonly type: 'symbol';
}

export interface NumberToken extends Token {
  readonly type: 'number';
}

export interface StringToken extends Token {
  readonly type: 'string';
}

