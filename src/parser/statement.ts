import type { ParserContext } from './parser_context.type';

import { unexpected_end_of_input, unexpected_token } from '../scanner/error';
import { consume_token, current_position, ensure_token, match_token, peek_token, previous_token } from './parser_context';

import type { Position } from '../scanner/Position.type';
import type { Attribute, Statement } from './expression.type';
import { parse_block_statement } from './statements/block_statement';
import { parse_input_statement } from './statements/input_statement';
import { parse_let_statement } from './statements/let_statement';
import { parse_output_statement } from './statements/output_statement';
import { parse_json_value } from './expressions/prefix';
import { parse_sequence } from './sequence';

export function parse_statement(ctx: ParserContext, attributes: Attribute[] = []): Statement {
  const token = peek_token(ctx);
  if (!token) {
    unexpected_end_of_input(current_position(ctx));
  }
  const { type, value } = token;
  if (type === 'identifier') {
    switch (value) {
      case 'in': return parse_input_statement(ctx, attributes);
      case 'let': return parse_let_statement(ctx, attributes);
      case 'out': return parse_output_statement(ctx, attributes);
    }
  }
  if (type === 'symbol') {
    switch (value) {
      case '{': return parse_block_statement(ctx, attributes);
      case '@': return parse_attribute(ctx, attributes);
    }
  }
  unexpected_token(value, token.start);
}

export function parse_attribute(ctx: ParserContext, attributes: Attribute[]): Statement {
  const  { start } = ensure_token(ctx, 'symbol', '@');
  const name = ensure_token(ctx, 'identifier').value;
  const { elements: parameters, end } = parse_sequence(ctx, ['(', ')'], ctx => parse_json_value(ctx));

  attributes.push({
    type: 'attribute',
    name,
    parameters,
    start,
    end
  });

  return parse_statement(ctx, attributes);
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
  unexpected_token(current.value, current.start);
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