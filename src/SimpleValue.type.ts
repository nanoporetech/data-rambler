import type { Range } from './Range';

export type SimpleValue = string | null | number | boolean | undefined | SimpleArray | SimpleObject | SimpleFunction | Range;
export type SimpleArray = Array<SimpleValue>;
export type SimpleFunction = (...params: SimpleValue[]) => SimpleValue;
export interface SimpleObject {
  [key: string]: SimpleValue;
}
