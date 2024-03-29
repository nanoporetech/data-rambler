import { unexpected_end_of_input } from '../../scanner/error';
import type { Attribute, BlockStatement, Statement } from '../expression.type';
import { current_position, ensure_token, match_token, tokens_remaining } from '../parser_context';
import type { ParserContext } from '../parser_context.type';
import { parse_statement } from '../statement';

export function parse_block_statement (ctx: ParserContext, attributes: Attribute[]): BlockStatement {
  const { start } = ensure_token(ctx, 'symbol', '{');
  const statements: Statement[] = [];

  while(match_token(ctx, 'symbol', '}') === false) {
    if (tokens_remaining(ctx) === false) {
      unexpected_end_of_input(current_position(ctx));
    }
    statements.push(parse_statement(ctx));
  }

  const { end } = ensure_token(ctx, 'symbol', '}');

  return {
    type: 'block_statement',
    statements,
    start,
    end,
    attributes,
  };
}