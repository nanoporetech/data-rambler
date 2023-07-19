import { compiler_error, unexpected_end_of_input, unexpected_token } from '../scanner/error';
import type { Fragment } from '../scanner/Position.type';

import type { Token, TokenTypes } from '../scanner/token.type';
import type { ParserContext } from './parser_context.type';

export function peek_token(ctx: ParserContext, offset = 0): Token | undefined {
  return ctx.source[ctx.index + offset];
}

export function consume_token(ctx: ParserContext): Token {
  if (tokens_remaining(ctx) === false) {
    unexpected_end_of_input(ctx.fragment.end, ctx.fragment.source);
  }
  const ch = ctx.source[ctx.index];
  ctx.index += 1;
  return ch!;
}

export function tokens_remaining(ctx: ParserContext): boolean {
  return ctx.index < ctx.fragment.end;
}

export function create_parser_context (source: Token[]): ParserContext {
  if (source.length === 0) {
    compiler_error('Unable to create parser context, no tokens were passed');
  }
  
  const { fragment: first } = source[0]!;
  const { fragment: last } = source[source.length - 1]!;

  const fragment = join_fragments(first, last); 
  
  return {
    source,
    index: 0,
    fragment,
  };
}

export function match_token(ctx: ParserContext, type: TokenTypes, value?: string, offset = 0): boolean {
  const token = peek_token(ctx, offset);
  if (!token || token.type !== type) {
    return false;
  }
  return !value || token.value === value;
}

export function ensure_token(ctx: ParserContext, type: TokenTypes, value?: string): Token {
  const token = consume_token(ctx);
  const correct_type = token.type === type;
  const correct_value = !value || token.value === value;
  if (correct_type && correct_value) {
    return token;
  }
  unexpected_token(token.value, token.fragment);
}

export function previous_token(ctx: ParserContext): Token {
  const last = peek_token(ctx, -1);
  if (!last) {
    throw new Error('Unreachable: "previous_token" should not be called if we haven\'t processed any tokens.');
  }
  return last;
}

export function join_fragments(first: Fragment, last: Fragment): Fragment {
  const { source, start } = first;
  const { end } = last;
  return { source, start, end };
}