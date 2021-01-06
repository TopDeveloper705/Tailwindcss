import { wrapit, escape, indent, hash } from './tools';

export class Property {
    name: string|string [];
    value: string;
    comment?:string;

    constructor(name: string|string [], value: string, comment?:string) {
        this.name = name;
        this.value = value;
        this.comment = comment;
    }

    toStyle(selector?:string) {
        return new Style(selector, this);
    }

    build(minify=false):string {
        const createProperty = (name: string, value: string) => {
            if (minify) {
                return `${name}:${value};`;
            } else {
                const p = `${name}: ${value};`;
                return this.comment? p + ` /* ${this.comment} */` : p;
            }
        };
        return (typeof this.name === 'string') ? createProperty(this.name, this.value) : this.name.map(i=>createProperty(i, this.value)).join(minify?'':'\n');
    }
}

export class Style {
    selector?: string;
    escape: boolean;
    property: (Style|Property) [];
    private _pseudoClasses?: string [];
    private _pseudoElements?: string [];
    private _parentSelectors?: string [];
    private _childSelectors?: string [];
    private _atRules?: string [];

    constructor(selector?: string, property?: Property | Style | (Style|Property) [], escape=true) {
        this.selector = selector;
        this.escape = escape;
        this.property = (property instanceof Property || property instanceof Style)?[property]:property ?? [];
    }

    get rule() {
        let result = this.selector ? this.escape ? escape(this.selector) : this.selector : '';
        this._parentSelectors && (result = `${this._parentSelectors.join(' ')} ${result}`);
        this._pseudoClasses && (result += `:${this._pseudoClasses.join(':')}`);
        this._pseudoElements && (result += `::${this._pseudoElements.join('::')}`);
        this._childSelectors && (result += ` ${this._childSelectors.join(' ')}`);
        return result;
    }

    get atRules() {
        return this._atRules;
    }

    get hash() {
        // hash without property
        return hash(this.atRules + this.rule);
    }

    clearAtRules() {
        this._atRules = [];
        return this;
    }

    atRule(string:string) {
        if (this._atRules) {
            this._atRules.push(string);
        } else {
            this._atRules = [ string ];
        }
        return this;
    }

    pseudoClass(string:string) {
        if (this._pseudoClasses) {
            this._pseudoClasses.push(string);
        } else {
            this._pseudoClasses = [ string ];
        }
        return this;
    }

    pseudoElement(string:string) {
        if (this._pseudoElements) {
            this._pseudoElements.push(string);
        } else {
            this._pseudoElements = [ string ];
        }
        return this;
    }

    parent(string:string) {
        if (this._parentSelectors) {
            this._parentSelectors.push(string);
        } else {
            this._parentSelectors = [ string ];
        }
        return this;
    }

    child(string:string) {
        if (this._childSelectors) {
            this._childSelectors.push(string);
        } else {
            this._childSelectors = [ string ];
        }
        return this;
    }

    add(item: Property | Style | (Property|Style) []) {
        if (Array.isArray(item)) {
            this.property = [...this.property, ...item];
        } else {
            this.property.push(item);
        }
        return this;
    }

    extend(item: Style|undefined, onlyProperty=false, append=true) {
        if (!item) return this;
        const connect = append? (list:any[]=[], anotherList:any[]=[]) => [...list, ...anotherList] : (list:any[]=[], anotherList:any[]=[]) => [...anotherList, ...list];
        this.property = connect(this.property, item.property);
        if (onlyProperty) return this;
        if (item.selector) this.selector = item.selector;
        if (item._atRules) this._atRules = connect(item._atRules, this._atRules); // atrule is build in reverse
        if (item._childSelectors) this._childSelectors = connect(this._childSelectors, item._childSelectors);
        if (item._parentSelectors) this._parentSelectors = connect(this._parentSelectors, item._parentSelectors);
        if (item._pseudoClasses) this._pseudoClasses = connect(this._pseudoClasses, item._pseudoClasses);
        if (item._pseudoElements) this._pseudoElements = connect(this._pseudoElements, item._pseudoElements);
        return this;
    }

    clean() {
        // remove duplicated property
        let property:(Style|Property)[] = [];
        let cache:string[] = [];
        this.property.forEach(i=>{
           if (i instanceof Property) {
               const inline = i.build();
               if (!cache.includes(inline)) {
                   cache.push(inline);
                   property.push(i);
               }
           } else {
               property.push(i);
           }
        })
        this.property = property;
        return this;
    }

    sort() {
        // sort property
        this.property = this.property.sort((a: Style|Property, b: Style|Property)=>{
            if (a instanceof Property && b instanceof Property) {
                return (a.build() > b.build())?1:-1;
            };
            return 0;
        });
        return this;
    }

    build(minify=false):string {
        if (!this.selector) return this.property.map(p=>p.build(minify)).join(minify?'':'\n').replace(/;}/g, '}');
        let result = (minify? this.rule.replace(/,\s/g, ',') : this.rule + ' ') + wrapit(this.property.map(p=>p.build(minify)).join(minify?'':'\n'), undefined, undefined, undefined, minify);
        if (this._atRules) {
            for (let rule of this._atRules) {
                result =  minify? `${rule.replace(/\s/g,'')}${wrapit(result, undefined, undefined, undefined, minify)}` : `${rule} ${wrapit(result, undefined, undefined, undefined, minify)}`;
            }
        }
        return minify ? result.replace(/;}/g, '}') : result;
    }

}

export class GlobalStyle extends Style {
    constructor(...args: any[]) {
        super(...args);
    }
}

export class StyleSheet {
    children: (Style)[];

    constructor(children?: (Style)[]) {
        this.children = children || [];
    }

    private _combineAtrules() {
        let atrules:{[key:string]:{[key:string]:any}} = {};
        const originAtrules = atrules;
        this.children.forEach((child)=>{
            if (child.atRules) {
                atrules = originAtrules;
                for (let i= child.atRules.length-1; i >= 0; i--) {
                    const atrule = child.atRules[i];
                    if (+i === 0) {
                        if (atrules[atrule]) {
                            atrules[atrule].root.push(child.clearAtRules());
                        } else {
                            atrules[atrule] = {root:[child.clearAtRules()]};
                        }
                    };
                    atrules = atrules[atrule];
                }
            }
        });
        // sort atrules 
        const sortedAtrules:{[key:string]:{[key:string]:any}} = {};
        Object.keys(originAtrules).reverse().forEach(key=>{
            sortedAtrules[key] = originAtrules[key];
        })
        return sortedAtrules;
    }

    private _buildAtrules(obj:{[key:string]:any}, tab=0, minify=false):string {
        let css = '';
        for (let [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                css += minify? value.map(i=>i.build(minify)).join('') : indent(value.map(i=>i.build()).join('\n'), tab) + '\n';
            } else {
                css += minify? `${key.replace(/\s/g,'')}{${this._buildAtrules(value, tab+2, minify)}}` : `\n${indent(key, tab)} {\n${this._buildAtrules(value, tab+2, minify)}${indent('}', tab)}\n`;
            }
        }
        return css;
    }

    add(item: Style | Style[]) {
        if (Array.isArray(item)) {
            this.children = [...this.children, ...item];
        } else {
            this.children.push(item);
        }
    }

    extend(styleSheet:StyleSheet|undefined, append=true) {
        if (styleSheet) this.children = append?[...this.children, ...styleSheet.children]:[...styleSheet.children, ...this.children];
        return this;
    }

    combine() {
        const styleMap:{[key:string]:Style} = {};
        this.children.forEach(v=>{
            const hash = v.hash;
            if (hash in styleMap) {
                styleMap[hash] = styleMap[hash].extend(v, true);
            } else {
                styleMap[hash] = v;
            }
        });
        this.children = Object.values(styleMap).map(i=>i.clean().sort());
        return this;
    }

    sort() {
        this.children = this.children.sort((a:Style, b:Style)=>(a.rule>b.rule)?1:-1);
        return this;
    }

    build(minify=false):string {
        if (minify) return this.children.filter(i=>!i.atRules).map(i=>i.build(minify)).join('') + this._buildAtrules(this._combineAtrules(), undefined, minify);
        return this.children.filter(i=>!i.atRules).map(i=>i.build()).join('\n\n') + '\n' + this._buildAtrules(this._combineAtrules());
    }
}