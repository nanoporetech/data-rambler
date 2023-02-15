import type { BinaryExpression, Expression, Module, ObjectExpression, PathExpression, PathSegment, ReduceSegment, SimplePrefixExpression, Statement } from '../parser/expression.type';

export function serialise (mod: Module): string {
  return mod.statements.map(serialise_stmt).join('');
}

export function indent (depth: number): string {
  return '  '.repeat(depth);
}

export function serialise_stmt (stmt: Statement, depth = 0): string {
  switch (stmt.type) {
    case 'block_statement':
      return indent(depth)
        + '{\n'
        + stmt.statements.map(sub_stmt => serialise_stmt(sub_stmt, depth + 1)).join('')
        + indent(depth)
        + '}\n';
    case 'input_statement':
      return indent(depth)
        + `in ${stmt.name}`
        + (stmt.default_value !== undefined ? ` = ${JSON.stringify(stmt.default_value)}` : '')
        + ';\n';
    case 'let_statement':
    case 'output_statement':
      return indent(depth)
        + `in ${stmt.name}`
        + serialise_expr(stmt.expression)
        + ';\n';
  }
}

export function serialise_expr (expr: Expression): string {
  switch (expr.type) {
    case 'add_expression': return serialise_simple_binary(expr, '+');
    case 'subtract_expression': return serialise_simple_binary(expr, '-');
    case 'divide_expression': return serialise_simple_binary(expr, '%');
    case 'multiply_expression': return serialise_simple_binary(expr, '*');
    case 'exponentiation_expression': return serialise_simple_binary(expr, '**');
    case 'remainder_expression': return serialise_simple_binary(expr, '%');

    case 'coalescing_expression': return serialise_simple_binary(expr, '??');

    case 'greater_than_expression': return serialise_simple_binary(expr, '>');
    case 'greater_than_or_equals_expression': return serialise_simple_binary(expr, '>=');
    case 'less_than_expression': return serialise_simple_binary(expr, '<');
    case 'less_than_or_equals_expression': return serialise_simple_binary(expr, '<=');

    case 'logical_and_expression': return serialise_simple_binary(expr, 'and');
    case 'logical_in_expression': return serialise_simple_binary(expr, 'in');
    case 'logical_or_expression':return serialise_simple_binary(expr, 'or');

    case 'equals_expression': return serialise_simple_binary(expr, '=');
    case 'not_equals_expression': return serialise_simple_binary(expr, '!=');

    case 'comma_expression': return serialise_simple_binary(expr, ',');
    case 'concat_expression': return serialise_simple_binary(expr, '&');
    case 'range_expression': return serialise_simple_binary(expr, '..');
    case 'chain_expression': return serialise_simple_binary(expr, '~>');

    case 'typeof_expression': return serialise_simple_prefix(expr, 'typeof');
    case 'not_expression': return serialise_simple_prefix(expr, 'not');
    case 'negate_expression': return serialise_simple_prefix(expr, '-');

    case 'array_expression': return `[ ${expr.elements.map(el => serialise_expr(el)).join(', ')} ]`;
    case 'assignment_expression': return `${expr.symbol} := ${serialise_expr(expr.expression)}`;
    case 'conditional_expression': return `${serialise_expr(expr.condition)} ? ${serialise_expr(expr.then_expression)}` + (expr.else_expression ? `: ${serialise_expr(expr.else_expression)}` : '');
    case 'call_expression': return `${serialise_expr(expr.callee)}(${expr.arguments.map(arg => serialise_expr(arg)).join(', ')})`;
    case 'json_expression': return JSON.stringify(expr.value);
    case 'field_expression': return quote_field_expr(expr);
    case 'identifier_expression': return `$${expr.value}`;
    case 'function_expression': return `fn (${expr.parameters.join(', ')}) { ${serialise_expr(expr.body)} }`;
    case 'descendant_expression': return '**';
    case 'wildcard_expression': return '*';
    case 'parent_expression': return '%';
    case 'group_expression': return `(${expr.expression ? serialise_expr(expr.expression) : ''})`;
    case 'object_expression': return serialise_object_literal(expr);
    case 'path_expression': return serialise_path(expr);
  }
}

export function serialise_simple_binary (expr: BinaryExpression<`${string}_expression`>, symbol: string): string {
  return `${serialise_expr(expr.left)} ${symbol} ${serialise_expr(expr.right)}`;
}

export function serialise_simple_prefix (expr: SimplePrefixExpression, symbol: string): string {
  return `${symbol} ${serialise_expr(expr.expression)}`;
}

function serialise_path(expr: PathExpression): string {
  const head = expr.head ? quote_field_expr(expr.head) : '';
  return head  + expr.segments.map(serialise_segment).join('');
}

export function serialise_segment(seg: PathSegment): string {
  switch (seg.type) {
    case 'filter':
      return `[${seg.expression ? serialise_expr(seg.expression) : ''}]`;
    case 'reduce':
      return serialise_object_literal(seg);
    case 'sort':
      return`^(${
        seg.elements.map(el => `${el.ascending ? '' : '>'} ${serialise_expr(el.expression)}`).join(', ')
      })`;
    case 'index':
      return `#$${seg.symbol}${seg.segments.map(serialise_segment).join('')}`;
    case 'context':
      return `.${quote_field_expr(seg.expression)}@$${seg.symbol}${seg.segments.map(serialise_segment).join('')}`;
    default:
      return `.${quote_field_expr(seg)}`;
  }
}

function quote_field_expr(expr: Expression): string {
  if (expr.type === 'field_expression') {
    return `"${expr.value.replace(/"/g, '\\"')}"`;
  }
  return serialise_expr(expr);
}

function serialise_object_literal(expr: ObjectExpression | ReduceSegment): string {
  return `{ ${expr.elements.map(el => `${serialise_expr(el.key)}: ${serialise_expr(el.value)}`).join(', ')} }`;
}
