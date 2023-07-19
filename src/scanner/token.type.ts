import type { Fragment } from './Position.type';

export type TokenTypes = 'identifier' | 'symbol' | 'number' | 'string';

export interface Token {
  readonly type: TokenTypes;
  readonly row: number;
  readonly fragment: Fragment;
  readonly value: string;
}
