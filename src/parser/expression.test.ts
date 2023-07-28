import { create_parser_context } from './parser_context';
import { scan } from '../scanner/scanner';
import type { ParserContext } from './parser_context.type';
import { parse_infix_expression, parse_prefix_expression } from './expression';
import type { Expression } from './expression.type';

function simple_create_context (source: string): ParserContext {
  const tokens = scan(source);
  return create_parser_context(tokens);
}

describe('expression', () => {
  it('throws for unterminated expression', () => {
    const ctx = simple_create_context('');
    expect(() => parse_prefix_expression(ctx)).toThrow('Unexpected end of input.');
  });
  it('throws for unexpected expression starting token', () => {
    const ctx = simple_create_context('}');
    expect(() => parse_prefix_expression(ctx)).toThrow('Invalid or unexpected token "}".');
  });
  it('parse_infix_expression returns null when no tokens are available', () => {
    const ctx = simple_create_context('0');
    // need a dummy expression for parse infix
    const left: Expression = { type: 'json_expression', value: 0, fragment: ctx.fragment };
    expect(parse_infix_expression(ctx, left, 0)).toEqual(null);
  });
});