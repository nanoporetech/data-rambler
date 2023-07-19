import type { Fragment } from '../scanner/Position.type';

export interface Sequence<T> {
  fragment: Fragment;
  elements: T[];
}