import { parse_expression } from '../expression';
import type { Attribute, FunctionStatement } from '../expression.type';

import { ensure_token, join_fragments } from '../parser_context';
import type { ParserContext } from '../parser_context.type';
import { parse_sequence } from '../sequence';

export function parse_function_statement (ctx: ParserContext, attributes: Attribute[]): FunctionStatement {
  const { fragment: start } = ensure_token(ctx, 'identifier', 'function');
  const name = ensure_token(ctx, 'identifier').value;

  const { elements: parameters } = parse_sequence(ctx, ['(', ')'], () => ensure_token(ctx, 'identifier').value);
  
  ensure_token(ctx, 'symbol', '{');
  const expression = parse_expression(ctx);
  const { fragment: end } = ensure_token(ctx, 'symbol', '}');

  const fragment = join_fragments(start, end);

  return {
    type: 'function_statement',
    name,
    fragment,
    parameters,
    expression,
    attributes,
  };
}