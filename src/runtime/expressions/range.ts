import type { BinaryExpression } from "../../parser/expression.type";
import { Range } from "../../Range";
import type { SimpleValue } from "../../SimpleValue.type";
import { enforce_number, eval_any_expr, ExpressionEnvironment } from "../expression";

export function eval_range_expr(ctx: ExpressionEnvironment, expr: BinaryExpression<'range_expression'>, value: SimpleValue): Range {
    const left = eval_any_expr(ctx, expr.left, value);
    const right = eval_any_expr(ctx, expr.right, value);
  
    if (left !== undefined) {
      enforce_number(expr.left, left);
    }
    if (right !== undefined) {
      enforce_number(expr.right, right);
    }
  
    if (left === undefined || right === undefined) {
      return new Range(0, 0);
    }
  
    if (!Number.isInteger(left)) {
      throw new Error(`Expected ${expr.left.type} @ (${expr.left.start.row}, ${expr.left.start.column}) to resolve to a integer but recieved ${left}`);
    }
  
    if (!Number.isInteger(right)) {
      throw new Error(`Expected ${expr.right.type} @ (${expr.right.start.row}, ${expr.right.start.column}) to resolve to a integer but recieved ${right}`);
    }
  
    return new Range(left, right);
  }