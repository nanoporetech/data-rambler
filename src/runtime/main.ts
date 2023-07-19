import { Emitter } from './Emitter';

import type { Statement, BlockStatement, Module, Expression } from '../parser/expression.type';
import type { Listener, Output } from './Emitter.type';
import type { Runtime } from './Runtime';
import { eval_root_expr } from './expression';
import { compiler_error } from '../scanner/error';

export function evaluate_declaration(runtime: Runtime, stmt: Statement, update: boolean): void {
  if (stmt.type === 'block_statement') {
    return;
  }

  switch (stmt.type) {
    case 'let_statement':
      // NOTE let statements cannot be updated
      runtime.declare_source(stmt.name);
      break;
    case 'input_statement': 
      runtime.declare_input(stmt.name, update);
      break;
    case 'output_statement': 
      runtime.declare_output(stmt.name, update);
      break;
  }
}

export function evaluate_statement(runtime: Runtime, stmt: Statement, update: boolean): void {
  if (stmt.type === 'block_statement') {
    return evaluate_block(runtime, stmt, update);
  }

  const target = runtime.resolve_source(stmt.name);
  if (!target) {
    compiler_error(`${stmt.name} is not defined`, stmt.fragment);
  }

  if (stmt.type === 'input_statement') {
    // NOTE we only want to initalise new inputs
    if (target.generation === runtime.generation) {
      target.emit(stmt.default_value);
    }
    return;
  }

  // NOTE we reuse output streams, but replace their bindings to ensure
  // it's pointing to the newest streams
  const stream = create_expression_stream(runtime, stmt.expression);
  runtime.bind_stream(stream, target);
}

export function evaluate_block(runtime: Runtime, { statements } : BlockStatement | Module, update: boolean): void {
  runtime.push_scope();

  for (const stmt of statements) {
    evaluate_declaration(runtime, stmt, update);
  }
  for (const stmt of statements) {
    evaluate_statement(runtime, stmt, update);
  }
  
  runtime.pop_scope();
}

export function create_expression_stream(runtime: Runtime, expr: Expression): Output {
  const ctx = create_reference_context(runtime);

  // STEP 1 - resolve references to parent streams
  list_references(ctx, expr);

  // STEP 2a - if no references then return static data stream
  if (Object.keys(ctx.references).length === 0) {
    const value = eval_root_expr(runtime, expr, undefined, {});
    const watch = (fn: Listener) => (fn(value), () => {
      // NOTE nothing to unsubscribe from
    });

    return { watch };
  }

  // STEP 2b - otherwise return new stream that is bound to parent streams and evaluates the expression in that context when the parent updates
  const source = Emitter.Combine(ctx.references);
  const watch = (next: Listener, error?: Listener<Error>) => {
    return source.watch(value => {
      let result;
      try {
        result = eval_root_expr(runtime, expr, undefined, value);
      } catch (err) {
        error?.(err instanceof Error ? err : new Error('Unexpected runtime error'));
      }
      next(result);
    });
  };

  return { watch };
}

// internal -- reference search

export function create_reference_context (runtime: Runtime): ReferenceContext {
  return {
    runtime,
    references: {},
    locals: new Set(Object.keys(runtime.globals)),
  };
}
interface ReferenceContext {
  readonly runtime: Runtime;
  readonly locals: Set<string>;
  readonly references: Record<string, Emitter>;
}

export function list_references(ctx: ReferenceContext, expr: Expression): void {
  switch (expr.type) {
  // binary expressions
    default:
      list_references(ctx, expr.left);
      list_references(ctx, expr.right);
      expr.type;
      break;

    case 'wildcard_expression':
    case 'parent_expression':
    case 'descendant_expression':
      break;

      // unary expressions
    case 'typeof_expression':
    case 'not_expression':
    case 'negate_expression':
      list_references(ctx, expr.expression);
      break;

      // ternary conditional
    case 'conditional_expression':
      list_references(ctx, expr.condition);
      list_references(ctx, expr.then_expression);
      if (expr.else_expression) {
        list_references(ctx, expr.else_expression);
      }
      break;

      // basic values
    case 'field_expression':
    case 'json_expression':
      break;

      // collections
    case 'array_expression':
      for (const el of expr.elements) {
        list_references(ctx, el);
      }
      break;
    case 'object_expression':
      for (const el of expr.elements) {
        list_references(ctx, el.key);
        list_references(ctx, el.value);
      }
      break;

      // everything else!
    case 'group_expression':
      if (expr.expression) {
        list_references({
          ...ctx, locals: new Set(ctx.locals),
        }, expr.expression);
      }
      break;

    case 'assignment_expression':
    // TODO should we add additonal protection for existing variables here
      ctx.locals.add(expr.symbol);
      list_references(ctx, expr.expression);
      break;

    case 'function_expression': {
      const child_ctx: ReferenceContext = {
        ...ctx,
        locals: new Set(ctx.locals),
      };
      for (const p of expr.parameters) {
        child_ctx.locals.add(p);
      }
      list_references(child_ctx, expr.body);
      break;
    }

    case 'path_expression': {
      if (expr.head) {
        list_references(ctx, expr.head);
      }
      for (const seg of expr.segments) {
        list_segment_reference(ctx, seg);
      }
      break;
    }

    case 'call_expression':
      list_references(ctx, expr.callee);
      for (const a of expr.arguments) {
        list_references(ctx, a);
      }
      break;

    case 'identifier_expression': {
      const symbol = expr.value;
      if (symbol === '' || ctx.locals.has(symbol)) {
        break;
      }
      const stream = ctx.runtime.resolve_source(symbol);
      if (stream) {
        ctx.references[symbol] = stream;
        ctx.locals.add(symbol);
        break;
      }
      throw new Error(`ReferenceError: "${symbol}" is not defined`);
    }
  } 
}

function list_segment_reference(ctx: ReferenceContext, seg: PathSegment) {
  switch (seg.type) {
    case 'filter':
      if (seg.expression) {
        list_references(ctx, seg.expression);
      }
      return;
    case 'sort':
      for (const elem of seg.elements) {
        list_references(ctx, elem.expression);
      }
      return;
    case 'reduce':
      for (const { key, value } of seg.elements) {
        list_references(ctx, key);
        list_references(ctx, value);
      }
      return;
    case 'context':
      list_references(ctx, seg.expression);
      for (const elem of seg.segments) {
        list_segment_reference(ctx, elem);
      }
      ctx.locals.add(seg.symbol);
      return;
    case 'index':
      for (const elem of seg.segments) {
        list_segment_reference(ctx, elem);
      }
      ctx.locals.add(seg.symbol);
      return;
  }
  return list_references(ctx, seg);
}