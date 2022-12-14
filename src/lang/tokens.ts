export class Token {
  type: TokenType;
  value?: string | number;
  meta?: string;

  constructor(type: TokenType, value?: string | number, meta?: string) {
    this.type = type;
    this.value = value;
    this.meta = meta;
  }
}

/*
  name        operators                 associativity       precedence level
  factor      int | str | template | bool | dict | list | tuple | (expr) | variable
    x[...]   x.attr  func()     L
    **                          R
    +x -x !x                    R
    * / %                       L
    + -                         L
    == != > >= <= < <=          L
    in not in                   L
    not                         R
    and                         L
    or                          L
    ... ? ... : ...             R
    exp1, exp2                  L
*/

/*

*/

export enum TokenType {
  NUMBER = 'NUMBER',
  PIXEL = 'PIXEL',
  REM = 'REM',
  EM = 'EM',
  SECOND = 'SECOND',
  DEGREE = 'DEGREE',
  PERCENTAGE = 'PERCENTAGE',
  STRING = 'STRING',
  TEMPLATE = 'TEMPLATE',
  COLOR = 'COLOR',
  // Arithmetic Operators
  PLUS = '+',
  MINUS = '-',
  MUL = '*',
  DIV = '/',
  MOD = '%',
  EXP = '**',
  // Assignment Operators
  ADDEQUAL = '+=',
  MINUSEQUAL = '-=',
  MULEQUAL = '*=',
  DIVEQUAL = '/=',
  MODEQUAL = '%=',
  EXPEQUAL = '**=',
  INCREASE = '++',
  DECREASE = '--',
  ARROW = '=>',
  // Comparison Operators
  EQUAL = '==',
  NOTEQUAL = '!=',
  GERATER = '>',
  LESS = '<',
  GERATEREQUAL = '>=',
  LESSEQUAL = '<=',
  TERNARY = '?',
  // Logical Operators
  NO = '!',
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  FROM = 'from',
  IN = 'in',
  NOTIN = 'not in',
  AS = 'as',

  NONE = 'None',
  TRUE = 'True',
  FALSE = 'False',

  DOLLAR = '$',
  DOT = '.',
  COMMA = ',',
  LPAREN = '(',
  RPAREN = ')',
  LCURLY = '{',
  RCURLY = '}',
  LSQUARE = '[',
  RSQUARE = ']',
  UNKNOWN = 'UNKNOWN',
  ASSIGN = '=',
  SPACE = 'SPACE',
  SEMI = ';',
  COLON = ':',
  EOF = 'EOF',
  ID = 'ID',
  VAR = '@var',
  APPLY = '@apply',
  ATTR = '@attr',
  MIXIN = '@mixin',
  INCLUDE = '@include',
  FUNC = '@func',
  ASYNC = '@async',
  AWAIT = '@await',
  RETURN = '@return',
  YIELD = '@yield',
  IMPORT = '@import',
  EXPORT = '@export',
  LOAD = '@load',
  IF = '@if',
  ELSE = '@else',
  ELIF = '@elif',
  WHILE = '@while',
  FOR = '@for',
  JS = '@js',
  LOG = '@log',
  WARN = '@warn',
  ERROR = '@error',
  ASSERT = '@assert',
  BREAK = '@break',
  CONTINUE = '@continue',
  TRY = '@try',
  EXCEPT = '@except',
  FINALLY = '@finally',
  WITH = '@with',
  RAISE = '@raise',
  DEL = '@del',
  NEW = 'new',
}

export const REVERSED_KEYWORDS: {[key:string]:Token} = {
  'apply': new Token(TokenType.APPLY, '@apply'),
  'attr': new Token(TokenType.ATTR, '@attr'),
  'mixin': new Token(TokenType.MIXIN, '@mixin'),
  'include': new Token(TokenType.INCLUDE, '@include'),
  'func': new Token(TokenType.FUNC, '@func'),
  'async': new Token(TokenType.ASYNC, '@async'),
  'return': new Token(TokenType.RETURN, '@return'),
  'yield': new Token(TokenType.YIELD, '@yield'),
  'break': new Token(TokenType.BREAK, '@break'),
  'continue': new Token(TokenType.CONTINUE, '@continue'),
  'try': new Token(TokenType.TRY, '@try'),
  'except': new Token(TokenType.EXCEPT, '@except'),
  'finally': new Token(TokenType.FINALLY, '@finally'),
  'raise': new Token(TokenType.RAISE, '@raise'),
  'with': new Token(TokenType.WITH, '@with'),
  'var': new Token(TokenType.VAR, '@var'),
  'load': new Token(TokenType.LOAD, '@load'),
  'import': new Token(TokenType.IMPORT, '@import'),
  'export': new Token(TokenType.EXPORT, '@export'),
  'if': new Token(TokenType.IF, '@if'),
  'else': new Token(TokenType.ELSE, '@else'),
  'elif': new Token(TokenType.ELIF, '@elif'),
  'while': new Token(TokenType.WHILE, '@while'),
  'for': new Token(TokenType.FOR, '@for'),
  'js': new Token(TokenType.JS, '@js'),
  'log': new Token(TokenType.LOG, '@log'),
  'warn': new Token(TokenType.WARN, '@warn'),
  'error': new Token(TokenType.ERROR, '@error'),
  'assert': new Token(TokenType.ASSERT, '@assert'),
  'del': new Token(TokenType.DEL, '@del'),
};

export class Num {
  token: Token;
  value: number;
  constructor(token: Token) {
    this.token = token;
    this.value = token.value as number;
  }
}

export class Bool {
  value: boolean;
  constructor(value: boolean) {
    this.value = value;
  }
}

export class None {
}

export class PIXEL extends Num {
}

export class REM extends Num {
}

export class Str {
  token: Token;
  value: string;
  constructor(token: Token) {
    this.token = token;
    this.value = token.value as string;
  }
}

export type DataType = Operand | Str | Template | Tuple | List | Dict | Bool | None | Func;

export class Tuple {
  values: (DataType)[];
  constructor(values: (DataType)[]) {
    this.values = values;
  }
}

export class List {
  values: (DataType)[];
  constructor(values: (DataType)[]) {
    this.values = values;
  }
}

export class Params {
  values: (DataType)[];
  constructor(values: (DataType)[]) {
    this.values = values;
  }
}

export class Dict {
  pairs: [string|number, (DataType)][];
  constructor(pairs: [string|number, (DataType)][]) {
    this.pairs = pairs;
  }
}

export class Template {
  token: Token;
  value: string;
  constructor(token: Token) {
    this.token = token;
    this.value = token.value as string;
  }
}


export class Apply {
  value: Str | Template;
  constructor(value: string) {
    const token = new Token(TokenType.STRING, value);
    this.value = /\${.*}/.test(value) ? new Template(token): new Str(token);
  }
}

export class Attr {
  attr: string;
  value: Str | Template;
  constructor(attr: string, value: string) {
    const token = new Token(TokenType.STRING, value);
    this.attr = attr;
    this.value = /\${.*}/.test(value) ? new Template(token): new Str(token);
  }
}

export class Var {
  token: Token;
  value: string;
  constructor(token: Token) {
    this.token = token;
    this.value = token.value as string;
  }
}

export class Assign {
  left: Var;
  op: Token;
  right: DataType;
  constructor(left: Var, op: Token, right: DataType) {
    this.left = left;
    this.op = op;
    this.right = right;
  }
}

export class Update {
  left: Var;
  op: Token;
  right: DataType;
  constructor(left: Var, op: Token, right: DataType) {
    this.left = left;
    this.op = op;
    this.right = right;
  }
}

export class Console {
  type: TokenType.LOG | TokenType.WARN | TokenType.ERROR | TokenType.ASSERT;
  expr: DataType;
  constructor(type: TokenType.LOG | TokenType.WARN | TokenType.ERROR | TokenType.ASSERT, expr: DataType) {
    this.type = type;
    this.expr = expr;
  }
}

export class JS {
  code: string;
  constructor(code: string) {
    this.code = code;
  }
}

export class PropDecl {
  name: string;
  value: Str | Template;
  constructor(name: string, value: Str | Template) {
    this.name = name;
    this.value = value;
  }
}

export class StyleDecl {
  selector: string;
  children: Block;
  constructor(selector: string, children: Block) {
    this.selector = selector;
    this.children = children;
  }
}

export class Block {
  statement_list: (Assign | Update | Console | NoOp)[];
  style_list: (StyleDecl | PropDecl | NoOp)[];
  constructor(statement_list: (Assign | Update | Console | NoOp)[], style_list: (StyleDecl | PropDecl | NoOp)[]) {
    this.statement_list = statement_list;
    this.style_list = style_list;
  }
}

export class Func {
  name?: string;
  params: string[];
  block: Block;
  async: boolean;
  constructor(params: string[], block: Block, name?: string, async = false) {
    this.name = name;
    this.params = params;
    this.block = block;
    this.async = async;
  }
}

export class Instance {
  name: string;
  params?: DataType[];
  constructor(name: string, params?: DataType[]) {
    this.name = name;
    this.params = params;
  }
}

export class Lambda {
  params: string[];
  expr: DataType;
  name?: string;
  async: boolean;
  constructor(params: string[], expr: DataType, name?:string, async = false) {
    this.params = params;
    this.expr = expr;
    this.name = name;
    this.async = async;
  }
}

export class Return {
  value: DataType;
  constructor(value: DataType) {
    this.value = value;
  }
}

export class Await {
  value: DataType;
  constructor(value: DataType) {
    this.value = value;
  }
}

export class Yield {
  value: DataType;
  constructor(value: DataType) {
    this.value = value;
  }
}

export class Del {
  value: DataType;
  constructor(value: DataType) {
    this.value = value;
  }
}

export class Raise {
  value: DataType;
  constructor(value: DataType) {
    this.value = value;
  }
}

export class Continue {
}

export class Break {

}

export class If {
  if_block: [DataType, Block];
  elif_blocks?: [DataType, Block][];
  else_block?: Block;
  constructor(expr: DataType, block: Block, elif_blocks?: [DataType, Block][], else_block?: Block) {
    this.if_block = [expr, block];
    this.elif_blocks = elif_blocks;
    this.else_block = else_block;
  }
  add_elif(expr: DataType, block: Block): void {
    this.elif_blocks = [...(this.elif_blocks ?? []), [expr, block]];
  }
  add_else(block: Block): void {
    this.else_block = block;
  }
}

export class Try {
  try_block: Block;
  except_blocks?: [string, Block, string|undefined][];
  finally_except_block?: Block;
  else_block?: Block;
  finally_block?: Block;
  constructor(block: Block) {
    this.try_block = block;
  }
  add_except(error: string, block: Block, alias?: string): void {
    this.except_blocks = [...(this.except_blocks ?? []), [error, block, alias]];
  }
  add_else(block: Block): void {
    this.else_block = block;
  }
  add_finally(block: Block): void {
    this.finally_block = block;
  }
  add_finally_except(block: Block): void {
    this.finally_except_block = block;
  }
}

export class While {
  if_block: [DataType, Block];
  else_block?: Block;
  constructor(expr: DataType, block: Block, else_block?: Block) {
    this.if_block = [expr, block];
    this.else_block = else_block;
  }
  add_else(block: Block): void {
    this.else_block = block;
  }
}

export class For {
  variables: string[];
  iterable: DataType;
  for_block: Block;
  else_block?: Block;
  constructor(variables: string[], iterable: DataType, for_block: Block, else_block?: Block) {
    this.variables = variables;
    this.iterable = iterable;
    this.for_block = for_block;
    this.else_block = else_block;
  }
  add_else(block: Block): void {
    this.else_block = block;
  }
}

export class With {
  expr: DataType;
  name: string;
  block: Block;
  constructor(expr: DataType, name: string, block: Block) {
    this.expr = expr;
    this.name = name;
    this.block = block;
  }
}

export class Program {
  block: Block;
  constructor(block: Block) {
    this.block = block;
  }
}

export class UnaryOp {
  op: Token;
  expr: Operand;
  constructor(op: Token, expr: Operand) {
    this.op = op;
    this.expr = expr;
  }
}

export class BinOp {
  left: Operand;
  op: Token;
  right: Operand;
  constructor(left: Operand, op: Token, right: Operand) {
    this.left = left;
    this.op = op;
    this.right = right;
  }
}

export class Import {
  urls: string[];
  constructor(urls: string[]) {
    this.urls = urls;
  }
}

export type Module = {
  url: string,
  default?: string,
  exports?: { [ key : string ] : string }
}

export class Load {
  modules: Module[];
  constructor(modules: Module[]) {
    this.modules = modules;
  }
}

export class NoOp {
  // NoOp node is used to represent an empty statement. such as {}
}

export type Operand = Num | BinOp | UnaryOp | NoOp;
