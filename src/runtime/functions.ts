import type { SimpleArray, SimpleObject, SimpleValue } from '../SimpleValue.type';
import { Range } from '../Range';

const un = undefined;

// eslint-disable-next-line @typescript-eslint/ban-types
export const functions: Record<string, Function> = {};

// eslint-disable-next-line @typescript-eslint/ban-types
function def(name: string, _type: string, fn: Function): void {
  // TODO actually parse/register the type
  functions[name] = fn;
}

def('sum', 'a<n>:n', (p0: number[]) => p0.reduce((a, v) => a + v, 0));
def('count', 'a:n', (p0: unknown[]) => p0.length);
def('max', 'a<n>:n', (p0: number[]) => p0.length ? Math.max(...p0) : un);
def('min', 'a<n>:n', (p0: number[]) => p0.length ? Math.min(...p0) : un);
def('abs', 'n:n', (p0: number) => Math.abs(p0));
def('floor', 'n:n', (p0: number) => Math.floor(p0));
def('ceil', 'n:n', (p0: number) => Math.ceil(p0));
def('round', 'n:n', (p0: number) => Math.round(p0));
def('sqrt', 'n:n', (p0: number) => Math.sqrt(p0));
def('random', ':n', () => Math.random());
def('exists', 'x:b', (p0: unknown) => p0 !== un);
def('reverse', 'a:a', (p0: unknown[]) => p0.reverse());
def('average', 'a<n>:n', (p0: number[]) => p0.length ? p0.reduce((a, v) => a + v, 0) / p0.length : un);
def('lowercase', 's:s', (p0: string) => p0.toLowerCase());
def('uppercase', 's:s', (p0: string) => p0.toUpperCase());
def('length', 's:n', (p0: string) => p0 !== un ? [...p0].length : un);
def('trim', 's:s', (p0: string) => p0.trim());
def('join', 'a<s>s?:s', (p0: string[], p1?: string) => p0.join(p1 ?? ''));
def('pad', 'sns?:s', (p0: string, p1: number, p2?: string) => p1 > 0 ? p0.padEnd(p1, p2) : p0.padStart(p1, p2));
def('distinct', 'a:a', (p0: unknown[]) => Array.from(new Set(p0)));
def('decodeUrl', 's:s', (p0: string) => p0 === un ? un : decodeURI(p0));
def('decodeUrlComponent', 's:s', (p0: string) => p0 === un ? un : decodeURIComponent(p0));
def('encodeUrl', 's:s', (p0: string) => p0 === un ? un : encodeURI(p0));
def('encodeUrlComponent', 's:s', (p0: string) => p0 === un ? un : encodeURIComponent(p0));
def('single', 'af?', (p0: unknown[], p1?: (v: unknown, i: number, a: unknown[]) => unknown) => p1 ? p0?.find(p1) : p0[0]);

function keys (p0: SimpleValue): string[] {
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

def('keys', 'x:a<s>', keys);

def('string', 'xb?:s', (p0: unknown, p1?: boolean) => {
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
});
def('number', 'x:m', (p0: unknown) => {
  if (p0 === un) {
    return un;
  }
  return Number(p0);
});
def('sift', 'of?:o', (p0: Record<string, unknown> | undefined, p1?: (v: unknown, k: string, a: Record<string, unknown>) => unknown) => {
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
def('each', 'of:a', (p0: SimpleObject | undefined, p1: (v: SimpleValue, k: string) => SimpleValue) => {
  if (p0 === un) {
    return un;
  }
  return Object.entries(p0).map(([k, v]) => p1(v, k));
});
def('zip', 'a+:a', (...p: Array<SimpleArray | undefined>[]) => {  
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
    throw new Error('SPLAT');
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

// NOTE these aren't implemented
def('substring', '', () => { throw new Error('NOT IMPLEMENTED');});
def('sort', '', () => { throw new Error('NOT IMPLEMENTED');});
def('shuffle', '', () => { throw new Error('NOT IMPLEMENTED');});
def('assert', '', () => { throw new Error('NOT IMPLEMENTED');});
def('error', '', () => { throw new Error('NOT IMPLEMENTED');});
def('spread', '', () => { throw new Error('NOT IMPLEMENTED');});
def('merge', '', () => { throw new Error('NOT IMPLEMENTED');});
def('lookup', '', () => { throw new Error('NOT IMPLEMENTED');});
def('foldLeft', '', () => { throw new Error('NOT IMPLEMENTED');});
def('filter', '', () => { throw new Error('NOT IMPLEMENTED');});
def('map', '', () => { throw new Error('NOT IMPLEMENTED');});
def('formatBase', '', () => { throw new Error('NOT IMPLEMENTED');});
def('formatNumber', '', () => { throw new Error('NOT IMPLEMENTED');});
def('base64encode', '', () => { throw new Error('NOT IMPLEMENTED');});
def('base64decode', '', () => { throw new Error('NOT IMPLEMENTED');});
def('substringAfter', '', () => { throw new Error('NOT IMPLEMENTED');});
def('substringBefore', '', () => { throw new Error('NOT IMPLEMENTED');});
// NOTE these require regex support
def('replace', '', () => { throw new Error('NOT IMPLEMENTED');});
def('match', '', () => { throw new Error('NOT IMPLEMENTED');});
def('contains', '', () => { throw new Error('NOT IMPLEMENTED');});
def('split', '', () => { throw new Error('NOT IMPLEMENTED');});
// NOTE these are replaced by language features
def('type', '', () => { throw new Error('NOT IMPLEMENTED');});
def('power', '', () => { throw new Error('NOT IMPLEMENTED');});
def('not', '', () => { throw new Error('NOT IMPLEMENTED');});