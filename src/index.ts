import { parse_expression } from './parser/expression';
import { parse } from './parser/parser';
import { create_parser_context, peek_token } from './parser/parser_context';
import { eval_root_expr } from './runtime/expression';
import { create_expression_stream, evaluate_block } from './runtime/main';
import { unexpected_token } from './scanner/error';
import { scan } from './scanner/scanner';

import type { Runtime } from './runtime/Runtime';
import type { Output } from './runtime/Emitter.type';
import type { SimpleObject, SimpleValue } from './SimpleValue.type';

export { Runtime } from './runtime/Runtime';
export { parse_expression } from './parser/expression';
export { parse } from './parser/parser';
export { scan } from './scanner/scanner';

export type { Input, Output, Listener } from './runtime/Emitter.type';

export function evaluate_module(runtime: Runtime, source: string): void {
  const tokens = scan(source);
  const ast = parse(tokens);
  
  evaluate_block(runtime, ast);
}
  
export function evaluate_expression(runtime: Runtime, source: string): Output {
  const tokens = scan(source);
  const ctx = create_parser_context(tokens);
  const ast = parse_expression(ctx);

  const remaining = peek_token(ctx);
  if (remaining) {
    unexpected_token(remaining.value);
  }
  
  return create_expression_stream(runtime, ast);
}
  
export function prepare_expression(runtime: Runtime, source: string): (value: SimpleValue, bindings: SimpleObject) => SimpleValue {
  const tokens = scan(source);
  const ctx = create_parser_context(tokens);
  const expr = parse_expression(ctx);

  const remaining = peek_token(ctx);
  if (remaining) {
    unexpected_token(remaining.value);
  }
  
  return (value = undefined, bindings = {}) => eval_root_expr(runtime, expr, value, bindings);
}