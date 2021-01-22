export function hash(str:string) {
    str = str.replace(/\r/g, '');
    let hash = 5381;
    let i = str.length;
  
    while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return (hash >>> 0).toString(36);
}

export function indent(code:string, tab=2) {
    const spaces = Array(tab).fill(' ').join('');
    return code.split('\n').map(line=>spaces+line).join('\n');
}

export function escape(selector:string):string {
    return selector.replace(/(?=\.|:|@|\+|\/|\$)/g, String.fromCharCode(92)).replace(/^\\\./, '.');
}

export function wrapit(code:string, start='{', end='}', tab=2, minify=false) {
    if (minify) return `${start}${code}${end}`;
    return `${start}\n${indent(code, tab)}\n${end}`;
}

export function isNumber(amount:string, start=-Infinity, end=Infinity, type:'int'|'float'='int') {
    const isInt = /^-?\d+$/.test(amount)
    if (type === 'int') {
        if (!isInt) return false;        
    } else {
        const isFloat = /^-?\d+\.\d+$/.test(amount)
        if (!(isInt || isFloat)) return false;
    };
    const num = parseFloat(amount);
    return num >= start && num <= end;
}

export function isFraction(amount:string) {
    return /^\d+\/\d+$/.test(amount);
}

export function isSize(amount:string) {
    return /^(\d+(\.\d+)?)+(rem|em|px|vh|vw)$/.test(amount);
}

export function isSpace(str:string) {
    return /^\s*$/.test(str);
}

export function roundUp(num:number, precision:number) {
    precision = Math.pow(10, precision)
    return Math.round(num * precision) / precision;
}
  
export function fracToPercent(amount:string) {
    const matches = amount.match(/[^\/]+/g)
    if (!matches) return;
    const a = + matches[0];
    const b = + matches[1];
    return roundUp(a/b*100, 6) + '%';
}

export function hex2RGB(hex:string) {
    const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;
    const [ , short, long ] = String(hex).match(RGB_HEX) || [];

    if (long) {
        const value = Number.parseInt(long, 16);
        return [ value >> 16, value >> 8 & 0xFF, value & 0xFF ];
    } else if (short) {
        return Array.from(short, s => Number.parseInt(s, 16)).map(n => (n << 4) | n);
    }
};

export function camelToDash(str:string) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

export function dashToCamel(str:string) {
    return str.toLowerCase().replace(/-(.)/g, (_, group) => group.toUpperCase());
}

export function getNestedValue(obj:{[key:string]:any}, key:string) {
    const keys = key.split('.');
    if ( keys.length === 0 ) return obj[key];
    let result = obj;
    const end = keys.length - 1;
    keys.forEach((value, index) => {
        result = result[value];
        if (index !== end && !result) result = {};
    });
    return result;
}

export function negateValue(value:string) {
    if (/(^0\w)|(^-)|(^0$)/.test(value)) return value;
    return '-' + value;
}

export function searchFrom(text:string, target:string|RegExp, startIndex=0, endIndex=undefined) {
    // search from partial of string
    const subText = text.substring(startIndex, endIndex);
    const relativeIndex = subText.search(target);
    return relativeIndex === -1 ? -1 : startIndex + relativeIndex;
}

export function deepCopy(obj:{}) {
    return JSON.parse(JSON.stringify(obj));
}