import type { ParserContext } from './parser_context.type';

import { unexpected_end_of_input, unexpected_token } from '../scanner/error';
import { consume_token, ensure_token, join_fragments, match_token, peek_token, previous_token } from './parser_context';

import type { Fragment } from '../scanner/Position.type';
import type { Attribute, Statement } from './expression.type';
import { parse_block_statement } from './statements/block_statement';
import { parse_input_statement } from './statements/input_statement';
import { parse_let_statement } from './statements/let_statement';
import { parse_output_statement } from './statements/output_statement';
import { parse_json_value } from './expressions/prefix';
import { parse_sequence } from './sequence';
import { parse_function_statement } from './statements/function_statement';

export function parse_statement(ctx: ParserContext, attributes: Attribute[] = []): Statement {
  const token = peek_token(ctx);
  if (!token) {
    unexpected_end_of_input(ctx.fragment.end, ctx.fragment.source);
  }
  const { type, value } = token;
  if (type === 'identifier') {
    switch (value) {
      case 'in': return parse_input_statement(ctx, attributes);
      case 'let': return parse_let_statement(ctx, attributes);
      case 'out': return parse_output_statement(ctx, attributes);
      case 'function': return parse_function_statement(ctx, attributes);
    }
  }
  if (type === 'symbol') {
    switch (value) {
      case '{': return parse_block_statement(ctx, attributes);
      case '@': return parse_attribute(ctx, attributes);
    }
  }
  unexpected_token(value, token.fragment);
}

export function parse_attribute(ctx: ParserContext, attributes: Attribute[]): Statement {
  const { fragment: start } = ensure_token(ctx, 'symbol', '@');
  const name = ensure_token(ctx, 'identifier').value;
  const { elements: parameters, fragment: end } = parse_sequence(ctx, ['(', ')'], ctx => parse_json_value(ctx));

  const fragment = join_fragments(start, end);
  attributes.push({
    type: 'attribute',
    name,
    parameters,
    fragment,
  });

  return parse_statement(ctx, attributes);
}

export function end_statement(ctx: ParserContext): Fragment {
  // standard semi-colon termination
  if (match_token(ctx, 'symbol', ';')) {
    return consume_token(ctx).fragment;
  }

  const previous = previous_token(ctx);

  // probably a closing block, if not the error will be caught elsewhere
  if (match_token(ctx, 'symbol', '}')) {
    return previous.fragment;
  }

  const current = peek_token(ctx);

  // either end of file or next token is on a different line
  if (!current || current.row > previous.row) {
    return previous.fragment;
  }

  unexpected_token(current.value, current.fragment);
}