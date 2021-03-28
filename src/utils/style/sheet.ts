import type { Style } from './base';
import { hash, deepCopy } from '../tools';
import sortSelector from '../algorithm/sortSelector';
import compileStyleSheet from '../algorithm/compileStyleSheet';
import { Layer } from '../../interfaces';

export class StyleSheet {
  children: Style[];
  prefixer = true;

  constructor(children?: Style[]) {
    this.children = children || [];
  }

  add(item?: Style | Style[]): this {
    if (!item) return this;
    if (Array.isArray(item)) {
      this.children = [...this.children, ...item];
    } else {
      this.children.push(item);
    }
    return this;
  }

  extend(styleSheet: StyleSheet | undefined, append = true, dedup = false): this {
    if (styleSheet) {
      let extended = styleSheet.children;
      if (dedup) {
        const hashes = extended.map(i => hash(i.build()));
        extended = extended.filter(i => !hashes.includes(hash(i.build())));
      }
      this.prefixer = styleSheet.prefixer;
      this.children = append? [...this.children, ...extended]: [...extended, ...this.children];
    }
    return this;
  }

  combine(): this {
    const styleMap: { [key: string]: Style } = {};
    this.children.forEach((style, index) => {
      const hashValue = hash(style.atRules + style.rule);
      if (hashValue in styleMap) {
        if (style.atRules?.includes('@font-face')) {
          // keeps multiple @font-face
          styleMap[hashValue + index] = style;
        } else {
          styleMap[hashValue] = styleMap[hashValue].extend(style, true);
        }
      } else {
        styleMap[hashValue] = style;
      }
    });
    this.children = Object.values(styleMap).map((i) => i.clean()); //.sort());
    return this;
  }

  layer(type: Layer): StyleSheet {
    const styleSheet = new StyleSheet(this.children.filter(i => i.meta.type === type));
    styleSheet.prefixer = this.prefixer;
    return styleSheet;
  }

  split(): { base: StyleSheet, components: StyleSheet, utilities: StyleSheet } {
    return {
      base: this.layer('base'),
      components: this.layer('components'),
      utilities: this.layer('utilities'),
    };
  }

  clone(): StyleSheet {
    return deepCopy(this);
  }

  sort(meta = false): this {
    this.children = meta ? this.children.sort((a, b) => {
      return a.meta.order - b.meta.order;
    }) : this.children.sort(sortSelector);
    return this;
  }

  build(minify = false): string {
    return compileStyleSheet(this.children, minify, this.prefixer);
  }
}
