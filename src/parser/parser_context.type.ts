import type { Fragment } from '../scanner/Position.type';
import type { Token } from '../scanner/token.type';

export interface ParserContext {
  source: Token[];
  index: number;
  fragment: Fragment;
}