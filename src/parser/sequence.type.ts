import type { Position } from '../scanner/Position.type';

export interface Sequence<T> {
  start: Position;
  end: Position;
  elements: T[];
}