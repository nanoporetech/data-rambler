import type { JSONValue } from '../JSON.type';
import type { Fragment } from '../scanner/Position.type';

export interface ExpressionBase<T extends `${string}_expression`> {
  type: T;
  fragment: Fragment;
}

export interface BinaryExpression<T extends `${string}_expression`> extends ExpressionBase<T> {
  left: Expression;
  right: Expression;
}

export interface AssignmentExpression extends ExpressionBase<'assignment_expression'> {
  symbol: string;
  expression: Expression;
}

export interface PropertyExpression extends ExpressionBase<'property_expression'> {
  left: Expression;
  symbol: string;
}

export interface ComputedPropertyExpression extends ExpressionBase<'computed_property_expression'> {
  left: Expression;
  field: Expression;
}

export interface WildExpression extends ExpressionBase<'wild_expression'> {
  left: Expression;
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

export type InfixExpression = 
  | BinaryExpression<'logical_in_expression'>
  | BinaryExpression<'logical_and_expression'>
  | BinaryExpression<'logical_or_expression'>
  | BinaryExpression<'comma_expression'>
  | BinaryExpression<'range_expression'>
  | BinaryExpression<'coalescing_expression'>
  | BinaryExpression<'chain_expression'> 
  | PropertyExpression
  | ComputedPropertyExpression
  | WildExpression
  | EqualityExpression
  | ComparisonExpression
  | ArithmeticExpression
  | AssignmentExpression
  | CallExpression
  | ConditionalExpression;

export interface SimplePrefixExpression extends ExpressionBase<'negate_expression' | 'not_expression' | 'plus_expression' | 'typeof_expression'> {
  expression: Expression;
}

export interface GroupExpression extends ExpressionBase<'group_expression'> {
  expression: Expression | undefined;
}

export interface JSONExpression extends ExpressionBase<'json_expression'> {
  value: JSONValue | undefined;
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
  | GroupExpression;

export type Expression = InfixExpression | PrefixExpression;

export interface StatementBase<T extends `${string}_statement`> {
  type: T;
  fragment: Fragment;
}

export interface InputStatement extends StatementBase<'input_statement'> {
  name: string;
  default_value: JSONValue | undefined;
  attributes: Attribute[];
}

export interface BlockStatement extends StatementBase<'block_statement'> {
  statements: Statement[];
  attributes: Attribute[];
}

export interface LetStatement extends StatementBase<'let_statement'> {
  name: string;
  expression: Expression;
  attributes: Attribute[];
}

export interface FunctionStatement extends StatementBase<'function_statement'> {
  name: string;
  parameters: string[];
  expression: Expression;
  attributes: Attribute[];
}

export interface OutputStatement extends StatementBase<'output_statement'> {
  name: string;
  expression: Expression;
  attributes: Attribute[];
}

export type Statement = InputStatement | BlockStatement | LetStatement | OutputStatement | FunctionStatement;

export interface Attribute {
  type: 'attribute';
  name: string;
  parameters: JSONValue[];
  fragment: Fragment;
}
export interface Module {
  type: 'module';
  fragment: Fragment;
  statements: Statement[];
}