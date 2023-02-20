import type { SimpleArray, SimpleObject, SimpleValue } from '../SimpleValue.type';
import { Range } from '../Range';
import { parse_function_type } from './Type';
import type { FunctionType } from './Type.type';
import type { TypedFunction } from './functions.type';

const un = undefined;

// eslint-disable-next-line @typescript-eslint/ban-types
export const functions: Record<string, Function> = {};
export const function_signatures: Record<string, FunctionType> = {};

// eslint-disable-next-line @typescript-eslint/ban-types
function def(name: string, type: string, fn: Function): void {
  (fn as TypedFunction).SIGNATURE = parse_function_type(type);
  functions[name] = fn;
}

export function cast_number (p0: unknown): number | undefined {
  if (p0 === un) {
    return un;
  }
  return Number(p0);
}

export function cast_bool (p0: unknown): boolean | undefined {
  switch (typeof p0) {
    case 'function':
    case 'undefined': return un;
    case 'boolean': return p0;
    case 'string': return p0.length > 0;
    case 'number': return p0 > 0;
    case 'object': {
      if (p0 === null) {
        return false;
      }
      if (Array.isArray(p0)) {
        return p0.length > 0 ? p0.some(v => cast_bool(v)) : false;
      }
      return Object.keys(p0).length > 0;
    }
  }
  return false;
}

export function cast_string (p0: unknown, p1?: boolean): string | undefined {
  if (p0 === un) {
    return un;
  }
  if (typeof p0 === 'string') {
    return p0;
  }
  if (typeof p0 === 'function') {
    return '';
  }
  return JSON.stringify(p0, (_, v: SimpleValue): SimpleValue => typeof  v === 'function' ? '' : v, p1 ? 2 : 0);
}

export function extended_typeof(value: unknown): 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function' | 'array' | 'null' {
  if (value === null) {
    return 'null';
  }
  const type = typeof value;
  
  if (type !== 'object') {
    return type;
  }
  return Array.isArray(value) ? 'array' : 'object';
}

export function equals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  const a_type = extended_typeof(a);
  if (a_type === extended_typeof(b)) {
    switch (a_type) {
      case 'array': {
        const aa = a as unknown[];
        const bb = b as unknown[];
        if (aa.length != bb.length) {
          return false;
        }
        return aa.every((value, index) => equals(value, bb[index]));
      }
      case 'object': {
        const aa = Object.entries(a as Record<string, unknown>);
        const bb = b as Record<string, unknown>;
        if (aa.length !== Object.keys(bb).length) {
          return false;
        }
        return aa.every(([key, value]) => equals(bb[key], value));
      }

    }
  }
  return false;
}

export function keys (p0: SimpleValue): string[] {
  if (Array.isArray(p0)) {
    const result = [];
    for (const el of p0) {
      result.push(...keys(el));
    }
    return result;
  }
  if (p0 instanceof Range) {
    return Object.keys(p0.expand());
  }
  if (p0 !== null && typeof p0 === 'object') {
    return Object.keys(p0);
  }
  return [];
}

export function round(value: number, dp = 0): number {
  const mult = 10 ** dp;
  return Math.round(value * mult) / mult;
}

export function magnitude(value: number): number {
  return Math.log10(Math.abs(value)) | 0;
}

export function round_sig(value: number, sf = 1): number {
  const dp = sf - magnitude(value) - 1;
  return round(value, dp);
}

const NEGATIVE_PREFIX = ['', 'm', 'μ', 'n', 'p', 'f', 'a', 'z', 'y'];

const POSITIVE_PREFIX = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

interface PrefixOptions {
  figures?: number;
  pluralize?: boolean;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function format_units(value: number, unit: string, options: PrefixOptions = {}): string {
  const { figures = 3, pluralize = false } = options ?? {};

  const mag = magnitude(value);
  const norm = value / 10 ** mag;

  const alignment = clamp(Math.round((mag - 1) / 3), 1 - NEGATIVE_PREFIX.length, POSITIVE_PREFIX.length - 1);
  const mult = 10 ** (mag - alignment * 3);
  const aligned_value = round_sig(mult * norm, figures);
  const is_plural = Math.abs(aligned_value) !== 1 && pluralize;
  // NOTE alignment is clamped to known units so this cannot be undefined
  const prefix = (alignment < 0 ? NEGATIVE_PREFIX[-alignment] : POSITIVE_PREFIX[alignment]) ?? '';

  return `${aligned_value} ${prefix}${unit}${is_plural ? 's' : ''}`;
}


// String Functions
def('string', 'xb?', cast_string);
def('length', 's', (p0: string) => p0 !== un ? [...p0].length : un);
def('slice', 'snn?', (p0: string, start: number, end?: number) => p0?.slice(start, end));
def('substring', 'snn', (p0: string, p1: number, p2: number) => {
  const start = p1 < 0 ? p0.length + 1 : p1;
  const end = p2 && start + p2; 
  return p0.slice(start,end);
});
def('substringAfter', 'ss', (p0: string, p1: string) => p0.split(p1)[1] ?? p0);
def('substringBefore', 'ss', (p0: string, p1: string) => p0.split(p1)[0]);
def('lowercase', 's', (p0: string) => p0.toLowerCase());
def('uppercase', 's', (p0: string) => p0.toUpperCase());
def('trim', 's', (p0: string) => p0.trim());
def('pad', 'sns?', (p0: string, p1: number, p2?: string) => p1 > 0 ? p0.padEnd(p1, p2) : p0.padStart(p1, p2));
// def('contains', 's(sf)', () => { throw new Error('NOT IMPLEMENTED');}); // awaiting regex
// def('split', 's(sf)n?', () => { throw new Error('NOT IMPLEMENTED');}); // awaiting regex
def('join', 'a<s>s?', (p0: string[], p1?: string) => p0.join(p1 ?? ''));
// def('match', 'sfn?', () => { throw new Error('NOT IMPLEMENTED');}); // awaiting regex
// def('replace', 's(sf)(sf)n?', () => { throw new Error('NOT IMPLEMENTED');}); // awaiting regex
// def('eval', 's', () => { throw new Error('UNSUPPORTED');});  // just evil
// def('base64encode', 's', (p0: string) => btoa(p0)); // probably want this to go away
// def('base64decode', 's', (p0: string) => atob(p0)); // probably want this to go away
def('format', 'sa', (p0: string, p1: unknown[]) => 
  p0.replace(/\$\{([0-9]*)\}/g, (_, v, i) => cast_string(p1[+v ?? i]) ?? '')
);
def('decodeUrl', 's', (p0: string) => p0 === un ? un : decodeURI(p0));
def('decodeUrlComponent', 's', (p0: string) => p0 === un ? un : decodeURIComponent(p0));
def('encodeUrl', 's', (p0: string) => p0 === un ? un : encodeURI(p0));
def('encodeUrlComponent', 's', (p0: string) => p0 === un ? un : encodeURIComponent(p0));

// Number Functions
def('number', 'x', cast_number);
def('abs', 'n', (p0: number) => Math.abs(p0));
def('floor', 'n', (p0: number) => Math.floor(p0));
def('ceil', 'n', (p0: number) => Math.ceil(p0));
def('clamp', 'nn?n?', (p0: number, p1 = -Infinity, p2 = Infinity) => Math.max(p1, Math.min(p0, p2)));
def('round', 'nn?', (p0: number, p1 = 0) => {
  const m = 10 ** p1;
  return Math.round(p0 * m) / m;
});
def('power', 'nn', (p0: number, p1: number) => Math.pow(p0, p1));
def('sqrt', 'n', (p0: number) => Math.sqrt(p0));
def('random', ':n', () => Math.random());
def('formatNumber', 'ns?o?', (p0: number, p1?: string, p2?: Intl.NumberFormatOptions) => p0.toLocaleString(p1, p2));
def('formatBase', 'nn?', (p0: number, p1?: number) => p0.toString(p1));
def('formatUnit', 'nso?', format_units);

// Aggregation Functions
def('sum', 'a<n>', (p0: number[]) => (Array.isArray(p0) ? p0: [p0]).reduce((a, v) => a + v, 0));
def('max', 'a<n>', (p0: number[]) => p0.length ? Math.max(...p0) : un);
def('min', 'a<n>', (p0: number[]) => p0.length ? Math.min(...p0) : un);
def('average', 'a<n>', (p0: number[]) => p0.length ? p0.reduce((a, v) => a + v, 0) / p0.length : un);

// Boolean Functions
def('boolean', 'x', cast_bool);
def('not', 'x', (p0: unknown) => !cast_bool(p0));
def('exists', 'x', (p0: unknown) => p0 !== un);

// Array Functions
def('count', 'a', (p0: unknown[]) => (Array.isArray(p0) ? p0: [p0]).length);
def('append', 'aa', (p0: unknown[], p1: unknown[]) => p0.concat(p1));
// def('sort', 'af?', () => { throw new Error('NOT IMPLEMENTED');}); // signature is incompatible with arr.sort and requires hand rolled sort
def('reverse', 'a', (p0: unknown[]) => p0.reverse());
def('indexOf', 'ax', (p0: unknown[], p1: unknown) => p0.indexOf(p1));
// def('shuffle', 'a', () => { throw new Error('NOT IMPLEMENTED');}); // TODO
def('distinct', 'a', (p0: unknown[]) => Array.from(new Set(p0)));
def('zip', 'a+', (...p: Array<SimpleArray | undefined>[]) => {  
  if (p.length === 0) {
    return [];
  }

  let l = Infinity;
  for (const pn of p) {
    if (pn === un || pn.length === 0) {
      return [];
    }
    if (pn.length < l) {
      l = pn.length;
    }
  }

  if (l > 1e9) {
    throw new Error('SPLAT'); // TODO fix me...
  }

  const result: SimpleArray[] = [];

  for (let i = 0; i < l; i += 1) {
    const el: SimpleArray = [];
    result.push(el);
    for (const pn of p) {
      el.push(pn[i]);
    }
  }
  return result;
});


// Object Functions 
def('keys', 'x', keys);
def('clone', 'x', (p0: SimpleValue) => JSON.parse(JSON.stringify(p0)) as SimpleValue);
def('values', 'o', (p0: SimpleObject) => Object.values(p0));
def('lookup', 'os', (p0: Record<string, unknown>[], p1: string) => p0.map(v => v[p1]));
def('spread', 'o', (p0: SimpleObject) => Object.entries(p0));
def('merge', 'oo', (p0: SimpleObject, p1: SimpleObject) => ({...p0, ...p1}));
def('sift', 'of?', (p0: Record<string, unknown> | undefined, p1?: (v: unknown, k: string, a: Record<string, unknown>) => unknown) => {
  if (p0 === un) {
    return un;
  }
  if (p1 === un) {
    return p0;
  }
  const pairs = Object.entries(p0).filter(([k, v]) => p1(v, k, p0));
  if (pairs.length === 0) {
    return un;
  }
  return Object.fromEntries(pairs);
});
def('each', 'of', (p0: SimpleObject | undefined, p1: (v: SimpleValue, k: string) => SimpleValue) => {
  if (p0 === un) {
    return un;
  }
  return Object.entries(p0).map(([k, v]) => p1(v, k));
});
def('error', 's', (msg: string) => { throw new Error(msg); });
def('assert', 'xs', (condition: unknown, msg: string) => { 
  if (!condition) {
    throw new Error(msg);  
  }
});
def('type', 'x', extended_typeof);
def('fromEntries', 'a<a>', (p0: [string, unknown][]) => Object.fromEntries(p0));

// Date/Time Functions
def('now', '', () => (new Date).toISOString());
def('millis', '', () => Date.now());
def('fromMillis', 'n', (p0: number) => (new Date(p0)).toISOString());
def('toMillis', 's', (p0: string) => (new Date(p0)).getTime());
def('formatTime', '(sn)o?', (p0: string | number, opts?: Intl.DateTimeFormatOptions) => (new Date(p0).toLocaleString(undefined, opts)));

// Higher Order Functions
def('map', 'af?', (p0: unknown[], p1?: (v: unknown, i: number, a: unknown[]) => unknown) => { 
  if (p1 === un) {
    return p0;
  }
  return p0.map(p1);
});
def('filter', 'af?', (p0: unknown[], p1?: (v: unknown, i: number, a: unknown[]) => unknown) => { 
  if (p1 === un) {
    return p0;
  }
  return p0.filter(p1);
});
def('single', 'af?', (p0: unknown[], p1?: (v: unknown, i: number, a: unknown[]) => unknown) => p1 ? p0?.find(p1) : p0[0]);
// def('reduce', 'af?', () => { throw new Error('NOT IMPLEMENTED'); }); // TODO