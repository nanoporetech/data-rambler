import type { InputStatement } from '../expression.type';
import { parse_json_value } from '../expressions/prefix';
import { consume_token, ensure_token, match_token } from '../parser_context';
import type { ParserContext } from '../parser_context.type';
import { end_statement } from '../statement';

export function parse_input_statement (ctx: ParserContext): InputStatement {
  const { start } = ensure_token(ctx, 'identifier', 'in');
  const name = ensure_token(ctx, 'identifier').value;

  let default_value = null;

  if (match_token(ctx, 'symbol', '=')) {
    consume_token(ctx);
    default_value = parse_json_value(ctx);
  }

  const end = end_statement(ctx);

  return {
    type: 'input_statement',
    name,
    start,
    end,
    default_value,
  };
}