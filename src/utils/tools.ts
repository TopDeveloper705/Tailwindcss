import type { NestObject } from '../interfaces';

export type Arrayable<T> = T | T[]

export function toArray<T>(v: Arrayable<T>): T[] {
  if (Array.isArray(v))
    return v;
  return [v];
}

export function hash(str: string): string {
  str = str.replace(/\r/g, '');
  let hash = 5381;
  let i = str.length;

  while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

export function type(val: unknown): string {
  return val === null
    ? 'Null'
    : val === undefined
      ? 'Undefined'
      : Object.prototype.toString.call(val).slice(8, -1);
}

export function indent(code: string, tab = 2): string {
  const spaces = Array(tab).fill(' ').join('');
  return code
    .split('\n')
    .map((line) => spaces + line)
    .join('\n');
}

export function wrapit(
  code: string,
  start = '{',
  end = '}',
  tab = 2,
  minify = false
): string {
  if (minify) return `${start}${code}${end}`;
  return `${start}\n${indent(code, tab)}\n${end}`;
}

export function isNumber(
  amount: string,
  start = -Infinity,
  end = Infinity,
  type: 'int' | 'float' = 'int'
): boolean {
  const isInt = /^-?\d+$/.test(amount);
  if (type === 'int') {
    if (!isInt) return false;
  } else {
    const isFloat = /^-?\d+\.\d+$/.test(amount);
    if (!(isInt || isFloat)) return false;
  }
  const num = parseFloat(amount);
  return num >= start && num <= end;
}

export function isFraction(amount: string): boolean {
  return /^\d+\/\d+$/.test(amount);
}

export function isSize(amount: string): boolean {
  return /^-?(\d+(\.\d+)?)+(rem|em|px|vh|vw|ch|ex)$/.test(amount);
}

export function isSpace(str: string): boolean {
  return /^\s*$/.test(str);
}

export function roundUp(num: number, precision = 0): number {
  precision = Math.pow(10, precision);
  return Math.round(num * precision) / precision;
}

export function fracToPercent(amount: string): string | undefined {
  const matches = amount.match(/[^/]+/g);
  if (!matches || matches.length < 2) return;
  const a = +matches[0];
  const b = +matches[1];
  return roundUp((a / b) * 100, 6) + '%';
}

export function hex2RGB(hex: string): number[] | undefined {
  const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;
  const [, short, long] = String(hex).match(RGB_HEX) || [];

  if (long) {
    const value = Number.parseInt(long, 16);
    return [value >> 16, (value >> 8) & 0xff, value & 0xff];
  } else if (short) {
    return Array.from(short, (s) => Number.parseInt(s, 16)).map(
      (n) => (n << 4) | n
    );
  }
}

export function camelToDash(str: string): string {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

export function dashToCamel(str: string): string {
  if (!/-/.test(str)) return str;
  return str.toLowerCase().replace(/-(.)/g, (_, group) => group.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNestedValue(obj: { [key: string]: any }, key: string): any {
  const topKey = key.match(/^\w+/);
  if (!topKey) return;
  let topValue = obj[topKey[0]];
  if (!topValue) return;
  let index = topKey[0].length;
  while(index < key.length) {
    const square = key.slice(index, ).match(/\[[^\s\]]+?\]/);
    const dot = key.slice(index, ).match(/\.\w+$|\.\w+(?=\.)/);
    if (( !square && !dot ) || ( square?.index === undefined && dot?.index === undefined )) return topValue;
    if (typeof topValue !== 'object') return;
    if (dot && dot.index !== undefined && (square?.index === undefined || dot.index < square.index)) {
      const arg = dot[0].slice(1,);
      topValue = topValue[arg];
      index += dot.index + dot[0].length;
    } else if (square && square.index !== undefined) {
      const arg = square[0].slice(1, -1).trim().replace(/^['"]+|['"]+$/g, '');
      topValue = topValue[arg];
      index += square.index + square[0].length;
    }
  }
  return topValue;
}

export function negateValue(value: string): string {
  if (/(^0\w)|(^-)|(^0$)/.test(value)) return value;
  return '-' + value;
}

export function searchFrom(
  text: string,
  target: string | RegExp,
  startIndex = 0,
  endIndex?: number
): number {
  // search from partial of string
  const subText = text.substring(startIndex, endIndex);
  const relativeIndex = subText.search(target);
  return relativeIndex === -1 ? -1 : startIndex + relativeIndex;
}

export function connectList<T = string>(a?: T[], b?: T[], append = true): T[] {
  return append ? [...(a ?? []), ...(b ?? [])] : [...(b ?? []), ...(a ?? [])];
}

export function toType(
  value: unknown,
  type: 'object'
): Record<string, unknown>;
export function toType(value: unknown, type: 'string'): string | undefined;
export function toType(value: unknown, type: 'number'): number | undefined;
export function toType(
  value: unknown,
  type: 'object' | 'string' | 'number'
): unknown {
  switch (type) {
  case 'object':
    return value && typeof value === 'object' ? value : {};
  case 'string':
    if (typeof value === 'string') return value as string;
    break;
  case 'number':
    if (typeof value === 'number') return value as number;
    break;
  }
}

export function deepCopy<T>(source: T): T {
  return Array.isArray(source)
    ? (source as unknown[]).map((item: unknown) => deepCopy(item))
    : source instanceof Date
      ? new Date(source.getTime())
      : source && typeof source === 'object'
        ? Object.getOwnPropertyNames(source).reduce((o, prop) => {
          const descriptor = Object.getOwnPropertyDescriptor(source, prop);
          if (descriptor) {
            Object.defineProperty(o, prop, descriptor);
            if (source && typeof source === 'object') {
              o[prop] = deepCopy(
                ((source as unknown) as { [key: string]: unknown })[prop]
              );
            }
          }
          return o;
        }, Object.create(Object.getPrototypeOf(source)))
        : (source as T);
}

export function isTagName(name: string): boolean {
  return ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embd', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'].includes(name);
}

export function flatColors(colors: NestObject, head?: string): { [key:string]: string | string[] } {
  let flatten: { [ key:string ]: string | string[] } = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string' || Array.isArray(value)) {
      flatten[(head && key === 'DEFAULT') ? head : head ? `${head}-${key}`: key] = value;
    } else {
      flatten = { ...flatten, ...flatColors(value, head ? `${head}-${key}`: key) };
    }
  }
  return flatten;
}

export function testRegexr(text: string, expressions: RegExp[]): boolean {
  for (const exp of expressions) {
    if (exp.test(text)) return true;
  }
  return false;
}

export function searchPropEnd(text: string, startIndex = 0): number {
  let index = startIndex;
  let output = -1;
  let openSingleQuote = false;
  let openDoubleQuote = false;
  while (index < text.length) {
    switch (text.charAt(index)) {
    case '\'':
      if (text.charAt(index - 1) !== '\\') openSingleQuote = !openSingleQuote;
      break;
    case '"':
      if (text.charAt(index - 1) !== '\\') openDoubleQuote = !openDoubleQuote;
      break;
    case ';':
      if (openSingleQuote === false && openDoubleQuote === false) output = index;
      break;
    default:
      break;
    }
    if (output !== -1) break;
    index++;
  }
  return output;
}

export function searchNotEscape(text:string, char = '{'): number {
  if (text.charAt(0) === char) return 0;
  const index = text.search(new RegExp(String.raw`([^\\]${char})`));
  if (index === -1) return -1;
  return index + 1;
}

export function guessClassName(selector: string): { selector: string, isClass: boolean, pseudo?: string } | { selector: string, isClass: boolean, pseudo?: string }[] {
  if (/\s*,\s*/.test(selector)) return selector.split(/\s*,\s*/g).map(i => guessClassName(i) as { selector: string, isClass: boolean });
  if (selector.charAt(0) !== '.') return { selector, isClass: false };
  const pos = searchNotEscape(selector, ':');
  if (pos === -1) return { selector: selector.slice(1, ).replace(/\\/g, ''), isClass: true };
  return { selector: selector.slice(1, pos).replace(/\\/g, ''), isClass: true, pseudo: selector.slice(pos,) };
}
