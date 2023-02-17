import { parse_expression } from '../expression';
import type { Attribute, LetStatement } from '../expression.type';
import { ensure_token } from '../parser_context';
import type { ParserContext } from '../parser_context.type';
import { end_statement } from '../statement';

export function parse_let_statement (ctx: ParserContext,  attributes: Attribute[]): LetStatement {
  const { start } = ensure_token(ctx, 'identifier', 'let');
  const name = ensure_token(ctx, 'identifier').value;
  
  ensure_token(ctx, 'symbol', '=');

  const expression = parse_expression(ctx);
  const end = end_statement(ctx);

  return {
    type: 'let_statement',
    name,
    expression,
    start,
    end,
    attributes,
  };
}