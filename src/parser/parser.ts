import { create_parser_context, tokens_remaining } from './parser_context';
import { parse_statement } from './statement';

import type { Token } from '../scanner/token.type';
import type { Module, Statement } from './expression.type';

export function parse(tokens: Token[]): Module {
  const ctx = create_parser_context(tokens);
  const statements: Statement[] = []; 
  const { fragment } = ctx;
  
  while (tokens_remaining(ctx)) {
    statements.push(parse_statement(ctx));
  }

  return { type: 'module', fragment, statements };
}