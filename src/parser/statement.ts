import type { ParserContext } from './parser_context.type';

import { unexpected_end_of_input, unexpected_token } from '../scanner/error';
import { consume_token, match_token, peek_token, previous_token } from './parser_context';

import type { Position } from '../scanner/Position.type';
import type { Statement } from './expression.type';
import { parse_block_statement } from './statements/block_statement';
import { parse_input_statement } from './statements/input_statement';
import { parse_let_statement } from './statements/let_statement';
import { parse_output_statement } from './statements/output_statement';

export function parse_statement(ctx: ParserContext): Statement {
  const token = peek_token(ctx);
  if (!token) {
    unexpected_end_of_input();
  }
  const { type, value } = token;
  if (type === 'identifier') {
    switch (value) {
      case 'in': return parse_input_statement(ctx);
      case 'let': return parse_let_statement(ctx);
      case 'out': return parse_output_statement(ctx);
    }
  }
  if (type === 'symbol' && value === '{') {
    return parse_block_statement(ctx);
  }
  unexpected_token(value);
}

export function end_statement(ctx: ParserContext): Position {
  // standard semi-colon termination
  if (match_token(ctx, 'symbol', ';')) {
    return consume_token(ctx).end;
  }

  const previous = previous_token(ctx);

  // probably a closing block, if not the error will be caught elsewhere
  if (match_token(ctx, 'symbol', '}')) {
    return previous.end;
  }

  const current = peek_token(ctx);

  // either end of file or next token is on a different line
  if (!current || current.start.row > previous.end.row) {
    return previous.end;
  }
  unexpected_token(current.value);
}

export function should_end_statement(ctx: ParserContext): boolean {
  // standard semi-colon termination
  if (match_token(ctx, 'symbol', ';')) {
    return true;
  }

  const previous = previous_token(ctx);
  const current = peek_token(ctx);

  return !current || current.start.row > previous.end.row;
}