import type { SimpleFunction } from '../SimpleValue.type';
import type { FunctionType } from './Type.type';

export interface TypedFunction extends SimpleFunction {
  SIGNATURE?: FunctionType;
}