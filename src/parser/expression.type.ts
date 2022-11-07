import type { JSONValue } from "../JSON.type";
import type { Position } from "../scanner/Position.type";

export interface ExpressionBase<T extends `${string}_expression`> {
  type: T;
  start: Position;
  end: Position;
}

export interface BinaryExpression<T extends `${string}_expression`> extends ExpressionBase<T> {
  left: Expression;
  right: Expression;
}

export interface AssignmentExpression extends ExpressionBase<'assignment_expression'> {
  symbol: string;
  expression: Expression;
}

export interface CallExpression extends ExpressionBase<'call_expression'> {
  callee: Expression;
  arguments: Expression[];
}

export interface ConditionalExpression extends ExpressionBase<'conditional_expression'> {
  condition: Expression;
  then_expression: Expression;
  else_expression: Expression | null;
}

export type ComparisonExpression = BinaryExpression<
| 'greater_than_or_equals_expression'
| 'less_than_or_equals_expression'
| 'greater_than_expression'
| 'less_than_expression'
>;

export type EqualityExpression = BinaryExpression<
| 'equals_expression'
| 'not_equals_expression'
>;

export type ArithmeticExpression = BinaryExpression<
| 'divide_expression'
| 'subtract_expression'
| 'add_expression'
| 'multiply_expression'
| 'exponentiation_expression'
| 'remainder_expression'
>;

export interface PathExpression extends ExpressionBase<'path_expression'> {
  head: Expression | null;
  segments: PathSegment[];
}

export type PathSegment = ReduceSegment | FilterSegment | SortSegment | IndexSegment | ContextSegment | Expression;

export interface ReduceSegment {
  type: 'reduce';
  start: Position;
  end: Position;
  elements: { key: Expression; value: Expression }[];
}

export interface FilterSegment {
  type: 'filter';
  start: Position;
  end: Position;
  expression: Expression;
}

export interface SortSegment {
  type: 'sort';
  start: Position;
  end: Position;
  elements: { ascending: boolean; expression: Expression }[];
}

export interface IndexSegment {
  type: 'index';
  start: Position;
  end: Position;
  symbol: string;
  segments: PathSegment[];
}

export interface ContextSegment {
  type: 'context';
  start: Position;
  end: Position;
  symbol: string;
  expression: Expression;
  segments: PathSegment[];
}

export type InfixExpression = 
  | BinaryExpression<'logical_in_expression'>
  | BinaryExpression<'logical_and_expression'>
  | BinaryExpression<'logical_or_expression'>
  | BinaryExpression<'comma_expression'>
  | BinaryExpression<'concat_expression'>
  | BinaryExpression<'range_expression'>
  | BinaryExpression<'coalescing_expression'>
  | BinaryExpression<'chain_expression'> 
  | PathExpression
  | EqualityExpression
  | ComparisonExpression
  | ArithmeticExpression
  | AssignmentExpression
  | CallExpression
  | ConditionalExpression;

export interface SimplePrefixExpression extends ExpressionBase<'negate_expression' | 'not_expression' | 'typeof_expression'> {
  expression: Expression;
}

export interface SymbolExpression extends ExpressionBase<'wildcard_expression' | 'descendant_expression' | 'parent_expression'> {}

export interface GroupExpression extends ExpressionBase<'group_expression'> {
  expression: Expression | undefined;
}

export interface JSONExpression extends ExpressionBase<'json_expression'> {
  value: JSONValue;
}

export interface ObjectExpression extends ExpressionBase<'object_expression'> {
  elements: { key: Expression; value: Expression }[];
}

export interface ArrayExpression extends ExpressionBase<'array_expression'> {
  elements: Expression[];
}

export interface IdentifierExpression extends ExpressionBase<'identifier_expression'> {
  value: string;
}

export interface FieldExpression extends ExpressionBase<'field_expression'> {
  value: string;
}

export interface FunctionExpression extends ExpressionBase<'function_expression'> {
  parameters: string[];
  body: Expression;
}

export type PrefixExpression = 
  | JSONExpression
  | ObjectExpression
  | ArrayExpression
  | IdentifierExpression
  | FunctionExpression
  | SimplePrefixExpression
  | GroupExpression
  | FieldExpression
  | SymbolExpression;

export type Expression = InfixExpression | PrefixExpression;


export interface InputStatement {
  type: 'input_statement';
  name: string;
  start: Position;
  end: Position;
  default_value: JSONValue;
}

export interface BlockStatement {
  type: 'block_statement';
  statements: Statement[];
  start: Position;
  end: Position;
}

export interface LetStatement {
  type: 'let_statement';
  name: string;
  expression: Expression;
  start: Position;
  end: Position;
}

export interface OutputStatement {
  type: 'output_statement';
  name: string;
  expression: Expression;
  start: Position;
  end: Position;
}

export type Statement = InputStatement | BlockStatement | LetStatement | OutputStatement;

export interface Module {
  type: 'module';
  start: Position;
  end: Position;
  statements: Statement[];
}