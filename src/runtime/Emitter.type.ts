import type { SimpleValue } from '../SimpleValue.type';

export type VoidFunction = () => void;
export type Listener<T = SimpleValue> = (value: T) => void;

export interface Input {
  emit (value: SimpleValue): void;
}

export interface Output<T = SimpleValue> {
  watch (fn: Listener<T>): VoidFunction;
}