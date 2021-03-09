import { Utility } from './handler';
import { pluginOrder } from '../../config/order';
import { dashToCamel, toType } from '../../utils/tools';
import { toRGB } from '../../utils/color';
import { Property, Style, Keyframes, Container } from '../../utils/style';
import { linearGradient, minMaxContent } from '../../utils/style/prefixer';
import {
  generateFontSize,
  expandDirection,
} from '../../utils/helpers';

import type { PluginUtils, FontSize, Output, DynamicUtility } from '../../interfaces';

// https://tailwindcss.com/docs/container
function container(utility: Utility, { theme }: PluginUtils): Output {
  if (utility.raw === 'container') {
    const className = utility.class;
    const baseStyle = new Container(utility.class, new Property('width', '100%'));
    const paddingDefault = toType(theme('container.padding.DEFAULT'), 'string');
    if (paddingDefault) {
      baseStyle.add(new Property('padding-left', paddingDefault));
      baseStyle.add(new Property('padding-right', paddingDefault));
    }
    if (theme('container.center')) baseStyle.add(new Property(['margin-left', 'margin-right'], 'auto'));
    const output: Container[] = [baseStyle];
    const screens = toType(theme('container.screens', theme('screens')), 'object') ?? {};
    for (const [screen, size] of Object.entries(screens)) {
      const props = [new Property('max-width', `${size}`)];
      const padding = theme(`container.padding.${screen}`);
      if (padding && typeof padding === 'string') {
        props.push(new Property('padding-left', padding));
        props.push(new Property('padding-right', padding));
      }
      output.push(new Container(className, props).atRule(`@media (min-width: ${size})`));
    }
    output.forEach((style, index) => style.meta = { type: 'utilities', corePlugin: true, group: 'container', order: pluginOrder['container'] + index + 1 } );
    return output;
  }
}

// https://tailwindcss.com/docs/object-position
function objectPosition(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleBody(theme('objectPosition'))
    .createProperty(['-o-object-position', 'object-position'])
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'objectPosition', order: pluginOrder['objectPosition'] });
}

// https://tailwindcss.com/docs/top-right-bottom-left
function inset(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleStatic(theme('inset'))
    .handleSpacing()
    .handleFraction()
    .handleSize()
    .handleNegative()
    .handleVariable().value;
  if (!value) return;
  switch (utility.identifier) {
  case 'top':
  case 'right':
  case 'bottom':
  case 'left':
    return new Property(utility.identifier, value).updateMeta({ type: 'utilities', corePlugin: true, group: 'inset', order: pluginOrder['inset']+ 4 });
  case 'inset':
    if (utility.raw.match(/^-?inset-x/)) {
      return new Property(['right', 'left'], value).updateMeta({ type: 'utilities', corePlugin: true, group: 'inset', order: pluginOrder['inset'] +3 });
    } else if (utility.raw.match(/^-?inset-y/)) {
      return new Property(['top', 'bottom'], value).updateMeta({ type: 'utilities', corePlugin: true, group: 'inset', order: pluginOrder['inset'] + 2 });
    } else {
      return new Property(['top', 'right', 'bottom', 'left'], value).updateMeta({ type: 'utilities', corePlugin: true, group: 'inset', order: pluginOrder['inset'] + 1 });
    }
  }
}

// https://tailwindcss.com/docs/z-index
function zIndex(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('zIndex'))
    .handleNumber(0, 99999, 'int')
    .handleNegative()
    .handleVariable()
    .createProperty('z-index')
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'zIndex', order: pluginOrder['zIndex'] + 1 });
}

// https://tailwindcss.com/docs/flex
// https://tailwindcss.com/docs/flex-grow
// https://tailwindcss.com/docs/flex-shrink
function flex(utility: Utility, { theme }: PluginUtils): Output {
  const className = utility.raw;
  if (className.startsWith('flex-grow')) {
    const map = (toType(theme('flexGrow'), 'object') ?? {}) as {
      [key: string]: string;
    };
    let amount = className.replace(/flex-grow-?/, '');
    if (amount === '') amount = 'DEFAULT';
    if (Object.keys(map).includes(amount))
      return new Property(
        [
          '-webkit-box-flex',
          '-ms-flex-positive',
          '-webkit-flex-grow',
          'flex-grow',
        ],
        map[amount]
      ).toStyle(utility.class).updateMeta({ type: 'utilities', corePlugin: true, group: 'flexGrow', order: pluginOrder['flexGrow'] + 1 });
  } else if (className.startsWith('flex-shrink')) {
    const map = (toType(theme('flexShrink'), 'object') ?? {}) as {
      [key: string]: string;
    };
    let amount = className.replace(/flex-shrink-?/, '');
    if (amount === '') amount = 'DEFAULT';
    if (Object.keys(map).includes(amount))
      return new Property(
        ['-ms-flex-negative', '-webkit-flex-shrink', 'flex-shrink'],
        map[amount]
      ).toStyle(utility.class).updateMeta({ type: 'utilities', corePlugin: true, group: 'flexShrink', order: pluginOrder['flexShrink'] + 1 });
  } else {
    const value = utility.handler.handleStatic(theme('flex')).value?.trim();
    if (value) {
      return new Style(utility.class, [
        new Property(
          '-webkit-box-flex',
          value.startsWith('0') || value === 'none' ? '0' : '1'
        ),
        new Property(['-ms-flex', '-webkit-flex', 'flex'], value),
      ]).updateMeta({ type: 'utilities', corePlugin: true, group: 'flex', order: pluginOrder['flex'] + 1 });
    }
  }
}

// https://tailwindcss.com/docs/order
function order(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleStatic(theme('order'))
    .handleNumber(1, 9999, 'int')
    .handleNegative()
    .handleVariable().value;
  if (value)
    return new Style(utility.class, [
      new Property(
        '-webkit-box-ordinal-group',
        value.startsWith('var')
          ? `calc(${value}+1)`
          : (parseInt(value) + 1).toString()
      ),
      new Property(['-webkit-order', '-ms-flex-order', 'order'], value),
    ]).updateMeta({ type: 'utilities', corePlugin: true, group: 'order', order: pluginOrder['order'] + 1 });
}

// https://tailwindcss.com/docs/grid-template-columns
// https://tailwindcss.com/docs/grid-template-rows
function gridTemplate(utility: Utility, { theme }: PluginUtils): Output {
  let type;

  if (utility.raw.match(/^grid-rows-/)) {
    type = 'rows';
  } else if (utility.raw.match(/^grid-cols-/)) {
    type = 'columns';
  } else {
    return;
  }

  const value = utility.handler
    .handleStatic(type === 'rows' ? theme('gridTemplateRows') : theme('gridTemplateColumns'))
    .createProperty(`grid-template-${type}`, (value: string) => value === 'none' ? 'none' : value);
  if (value) return value.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridTemplateColumns', order: pluginOrder['gridTemplateColumns'] + 1 });
  return utility.handler
    .handleNumber(1, undefined, 'int')
    .handleVariable()
    .createProperty(`grid-template-${type}`, (value: string) => `repeat(${value}, minmax(0, 1fr))`)
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridTemplateColumns', order: pluginOrder['gridTemplateColumns'] + 2 });
}

// https://tailwindcss.com/docs/grid-column
function gridColumn(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.body;
  // col span
  const spans = (toType(theme('gridColumn'), 'object') ?? {}) as {
    [key: string]: string;
  };
  if (Object.keys(spans).includes(body)) {
    return new Property(['-ms-grid-column-span', 'grid-column'], spans[body]).updateMeta({ type: 'utilities', corePlugin: true, group: 'gridColumn', order: pluginOrder['gridColumn'] + 1 });
  }
  if (utility.raw.startsWith('col-span')) {
    return utility.handler
      .handleNumber(1, undefined, 'int')
      .handleVariable()
      .createProperty(
        ['-ms-grid-column-span', 'grid-column'],
        (value: string) => `span ${value} / span ${value}`
      )
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridColumn', order: pluginOrder['gridColumn'] + 1 });
  }
  // col end
  if (utility.raw.startsWith('col-end')) {
    return utility.handler
      .handleStatic(theme('gridColumnEnd'))
      .handleNumber(1, undefined, 'int')
      .handleVariable()
      .createProperty('grid-column-end')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridColumnEnd', order: pluginOrder['gridColumnEnd'] + 1 });
  }
  // col start
  if (utility.raw.startsWith('col-start')) {
    return utility.handler
      .handleStatic(theme('gridColumnStart'))
      .handleNumber(1, undefined, 'int')
      .handleVariable()
      .createProperty('grid-column-start')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridColumnStart', order: pluginOrder['gridColumnStart'] + 1 });
  }
}

// https://tailwindcss.com/docs/grid-row
function gridRow(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.body;
  // row span
  const spans = (toType(theme('gridRow'), 'object') ?? {}) as {
    [key: string]: string;
  };
  if (Object.keys(spans).includes(body)) {
    return new Property(['-ms-grid-row-span', 'grid-row'], spans[body]).updateMeta({ type: 'utilities', corePlugin: true, group: 'gridRow', order: pluginOrder['gridRow'] + 1 });
  }
  if (utility.raw.startsWith('row-span')) {
    return utility.handler
      .handleNumber(1, undefined, 'int')
      .handleVariable()
      .createProperty(
        ['-ms-grid-row-span', 'grid-row'],
        (value: string) => `span ${value} / span ${value}`
      )
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridRow', order: pluginOrder['gridRow'] + 2 });
  }
  // row end
  if (utility.raw.startsWith('row-end')) {
    return utility.handler
      .handleStatic(theme('gridRowEnd'))
      .handleNumber(1, undefined, 'int')
      .handleVariable()
      .createProperty('grid-row-end')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridRowEnd', order: pluginOrder['gridRowEnd'] + 1 });
  }
  // row start
  if (utility.raw.startsWith('row-start')) {
    return utility.handler
      .handleStatic(theme('gridRowStart'))
      .handleNumber(1, undefined, 'int')
      .handleVariable()
      .createProperty('grid-row-start')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'gridRowStart', order: pluginOrder['gridRowStart'] + 1 });
  }
}

// https://tailwindcss.com/docs/grid-auto-columns
// https://tailwindcss.com/docs/grid-auto-rows
function gridAuto(utility: Utility, { theme }: PluginUtils): Output {
  const type = utility.raw.startsWith('auto-cols')
    ? 'columns'
    : utility.raw.startsWith('auto-rows')
      ? 'rows'
      : undefined;
  if (!type) return;
  const group = type === 'columns' ? 'gridAutoColumns' : 'gridAutoRows';
  const value = utility.handler.handleStatic(theme(group)).value;
  if (value) {
    const prefixer = minMaxContent(value);
    if (typeof prefixer === 'string') return new Property(`grid-auto-${type}`, prefixer).updateMeta({ type: 'utilities', corePlugin: true, group: group, order: pluginOrder[group] + 1 });
    return new Style(utility.class, prefixer.map((i) => new Property(`grid-auto-${type}`, i))).updateMeta({ type: 'utilities', corePlugin: true, group: group, order: pluginOrder[group] + 2 });
  }
}

// https://tailwindcss.com/docs/gap
function gap(utility: Utility, { theme, config }: PluginUtils): Output {
  const value = utility.handler
    .handleStatic(theme('gap'))
    .handleSpacing()
    .handleSize()
    .handleVariable().value;
  if (!value) return;
  if (utility.raw.match(/^gap-x-/)) {
    return new Property(config('prefixer') ? ['-webkit-column-gap', '-moz-column-gap', 'grid-column-gap', 'column-gap'] : 'column-gap', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'gap', order: pluginOrder['gap'] + 3 });
  } else if (utility.raw.match(/^gap-y-/)) {
    return new Property(config('prefixer') ? ['-webkit-row-gap', '-moz-row-gap', 'grid-row-gap', 'row-gap'] : 'row-gap', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'gap', order: pluginOrder['gap'] + 2 });
  } else {
    return new Property(config('prefixer') ? ['grid-gap', 'gap'] : 'gap', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'gap', order: pluginOrder['gap'] + 1 });
  }
}

// https://tailwindcss.com/docs/padding
function padding(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleStatic(theme('padding'))
    .handleSpacing()
    .handleSize()
    .handleVariable().value;
  if (!value) return;
  const directions = expandDirection(utility.identifier.substring(1), false);
  if (directions) {
    if (directions[0] === '*') return new Property('padding', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'padding', order: pluginOrder['padding'] + 1 });
    return new Property(directions.map((i) => `padding-${i}`), value).updateMeta({ type: 'utilities', corePlugin: true, group: 'padding', order: pluginOrder['padding'] + 2 });
  }
}

// https://tailwindcss.com/docs/margin
function margin(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleStatic(theme('margin'))
    .handleSpacing()
    .handleSize()
    .handleNegative()
    .handleVariable().value;
  if (!value) return;
  const directions = expandDirection(utility.identifier.substring(1), false);
  if (directions) {
    if (directions[0] === '*') return new Property('margin', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'margin', order: pluginOrder['margin'] + 1 });
    return new Property(directions.map((i) => `margin-${i}`), value).updateMeta({ type: 'utilities', corePlugin: true, group: 'margin', order: pluginOrder['margin'] + 2 });
  }
}

// https://tailwindcss.com/docs/space
function space(utility: Utility, { theme }: PluginUtils): Output {
  if (utility.raw === 'space-x-reverse')
    return new Property('--tw-space-x-reverse', '1').updateMeta({ type: 'utilities', corePlugin: true, group: 'space', order: pluginOrder['space'] - 1 });
  if (utility.raw === 'space-y-reverse')
    return new Property('--tw-space-y-reverse', '1').updateMeta({ type: 'utilities', corePlugin: true, group: 'space', order: pluginOrder['space'] - 2 });
  const value = utility.handler
    .handleStatic(theme('space'))
    .handleSpacing()
    .handleSize()
    .handleNegative()
    .handleVariable().value;
  if (!value) return;
  if (utility.raw.match(/^-?space-x-/)) {
    return new Style(utility.class, [
      new Property('--tw-space-x-reverse', '0'),
      new Property(
        'margin-right',
        `calc(${value} * var(--tw-space-x-reverse))`
      ),
      new Property(
        'margin-left',
        `calc(${value} * calc(1 - var(--tw-space-x-reverse)))`
      ),
    ]).child('> :not([hidden]) ~ :not([hidden])')
      .updateMeta({ type: 'utilities', corePlugin: true, group: 'space', order: pluginOrder['space'] + 2 });
  }
  if (utility.raw.match(/^-?space-y-/)) {
    return new Style(utility.class, [
      new Property('--tw-space-y-reverse', '0'),
      new Property(
        'margin-top',
        `calc(${value} * calc(1 - var(--tw-space-y-reverse)))`
      ),
      new Property(
        'margin-bottom',
        `calc(${value} * var(--tw-space-y-reverse))`
      ),
    ]).child('> :not([hidden]) ~ :not([hidden])')
      .updateMeta({ type: 'utilities', corePlugin: true, group: 'space', order: pluginOrder['space'] + 1 });
  }
}

// https://tailwindcss.com/docs/width
// https://tailwindcss.com/docs/height
function size(utility: Utility, { theme }: PluginUtils): Output {
  const name = utility.identifier === 'w' ? 'width' : 'height';
  const body = utility.body;
  const sizes = (toType(theme(name), 'object') ?? {}) as {
    [key: string]: string;
  };
  // handle static
  if (Object.keys(sizes).includes(body)) {
    const value = sizes[body];
    if (value === 'min-content') {
      return new Style(utility.class, [
        new Property(name, '-webkit-min-content'),
        new Property(name, '-moz-min-content'),
        new Property(name, 'min-content'),
      ]).updateMeta({ type: 'utilities', corePlugin: true, group: name, order: pluginOrder[name] + 2 });
    } else if (value === 'max-content') {
      return new Style(utility.class, [
        new Property(name, '-webkit-max-content'),
        new Property(name, '-moz-max-content'),
        new Property(name, 'max-content'),
      ]).updateMeta({ type: 'utilities', corePlugin: true, group: name, order: pluginOrder[name] + 3 });
    } else {
      return new Style(utility.class, new Property(name, value)).updateMeta({ type: 'utilities', corePlugin: true, group: name, order: pluginOrder[name] + 1 });
    }
  }
  return utility.handler
    .handleSpacing()
    .handleFraction()
    .handleSize()
    .handleNxl((number: number) => `${(number - 3) * 8 + 48}rem`)
    .handleVariable()
    .createProperty(name)
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: name, order: pluginOrder[name] + 4 });
}

// https://tailwindcss.com/docs/min-width
// https://tailwindcss.com/docs/min-height
// https://tailwindcss.com/docs/max-width
// https://tailwindcss.com/docs/max-height
function minMaxSize(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.raw.replace(/^(min|max)-[w|h]-/, '');
  const prop = utility.raw
    .substring(0, 5)
    .replace('h', 'height')
    .replace('w', 'width');
  const group = dashToCamel(prop);
  const sizes = (toType(theme(group), 'object') ?? {}) as {
    [key: string]: string;
  };
  // handle static
  if (Object.keys(sizes).includes(body)) {
    const value = sizes[body];
    if (value === 'min-content') {
      return new Style(utility.class, [
        new Property(prop, '-webkit-min-content'),
        new Property(prop, '-moz-min-content'),
        new Property(prop, 'min-content'),
      ]).updateMeta({ type: 'utilities', corePlugin: true, group: group, order: pluginOrder[group] + 2 });
    } else if (value === 'max-content') {
      return new Style(utility.class, [
        new Property(prop, '-webkit-max-content'),
        new Property(prop, '-moz-max-content'),
        new Property(prop, 'max-content'),
      ]).updateMeta({ type: 'utilities', corePlugin: true, group: group, order: pluginOrder[group] + 3 });
    } else {
      return new Style(utility.class, new Property(prop, value)).updateMeta({ type: 'utilities', corePlugin: true, group: group, order: pluginOrder[group] + 1 });
    }
  }

  return utility.handler
    .handleSpacing()
    .handleFraction()
    .handleSize()
    .handleNxl((number: number) => `${(number - 3) * 8 + 48}rem`)
    .handleVariable()
    .createProperty(prop)
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: group, order: pluginOrder[group] + 4 });
}

// https://tailwindcss.com/docs/font-size
// https://tailwindcss.com/docs/text-opacity
// https://tailwindcss.com/docs/text-color
function text(utility: Utility, { theme }: PluginUtils): Output {
  // handle font opacity
  if (utility.raw.startsWith('text-opacity'))
    return utility.handler
      .handleStatic(theme('textOpacity'))
      .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
      .handleVariable()
      .createProperty('--tw-text-opacity')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'textOpacity', order: pluginOrder['textOpacity'] + 1 });
  // handle font sizes
  const amount = utility.amount;
  const fontSizes = (toType(theme('fontSize'), 'object') ?? {}) as {
    [key: string]: FontSize;
  };
  if (Object.keys(fontSizes).includes(amount))
    return new Style(utility.class, generateFontSize(fontSizes[amount])).updateMeta({ type: 'utilities', corePlugin: true, group: 'fontSize', order: pluginOrder['fontSize'] + 1 });
  let value = utility.handler
    .handleNxl((number: number) => `${number}rem`)
    .handleSize().value;
  if (utility.raw.startsWith('text-size-$')) value = utility.handler.handleVariable().value;
  if (value) return new Style(utility.class, [ new Property('font-size', value), new Property('line-height', '1') ]).updateMeta({ type: 'utilities', corePlugin: true, group: 'fontSize', order: pluginOrder['fontSize'] + 2 });

  // handle colors
  value = utility.handler.handleColor(theme('textColor')).handleVariable()
    .value;
  if (value) {
    if (['transparent', 'currentColor'].includes(value) || value.startsWith('var')) return new Property('color', value);
    return new Style(utility.class, [
      new Property('--tw-text-opacity', '1'),
      new Property(
        'color',
        `rgba(${
          value.startsWith('var') ? value : toRGB(value)?.join(', ')
        }, var(--tw-text-opacity))`
      ),
    ]).updateMeta({ type: 'utilities', corePlugin: true, group: 'textColor', order: pluginOrder['textColor'] + 1 });
  }
}

// https://tailwindcss.com/docs/font-family
// https://tailwindcss.com/docs/font-weight
function font(utility: Utility, { theme }: PluginUtils): Output {
  const fonts = theme('fontFamily') as {[key:string]:string|string[]};
  const map:{[key:string]:string} = {};
  for (const [key, value] of Object.entries(fonts)) {
    map[key] = Array.isArray(value)? value.join(',') : value;
  }
  return (
    utility.handler
      .handleStatic(map)
      .createProperty('font-family')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'fontFamily', order: pluginOrder['fontFamily'] + 1 }) ||
    utility.handler
      .handleStatic(theme('fontWeight'))
      .handleNumber(0, 900, 'int')
      .handleVariable()
      .createProperty('font-weight')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'fontWeight', order: pluginOrder['fontWeight'] + 1 })
  );
}

// https://tailwindcss.com/docs/letter-spacing
function letterSpacing(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('letterSpacing'))
    .handleSize()
    .handleNegative()
    .handleVariable()
    .createProperty('letter-spacing')
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'letterSpacing', order: pluginOrder['letterSpacing'] + 1 });
}

// https://tailwindcss.com/docs/line-height
function lineHeight(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('lineHeight'))
    .handleNumber(0, undefined, 'int', (number: number) => `${number * 0.25}rem`)
    .handleSize()
    .handleVariable()
    .createProperty('line-height')
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'lineHeight', order: pluginOrder['lineHeight'] + 1 });
}

// https://tailwindcss.com/docs/list-style-type
function listStyleType(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('listStyleType'))
    .createProperty('list-style-type')
    ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'listStyleType', order: pluginOrder['listStyleType'] + 1 });
}

// https://tailwindcss.com/docs/placeholder-color
// https://tailwindcss.com/docs/placeholder-opacity
function placeholder(utility: Utility, { theme, config }: PluginUtils): Output {
  // handle placeholder opacity
  if (utility.raw.startsWith('placeholder-opacity'))
    return utility.handler
      .handleStatic(theme('placeholderOpacity'))
      .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
      .handleVariable()
      .createProperty('--tw-placeholder-opacity')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderOpacity', order: pluginOrder['placeholderOpacity'] + 1 });
  const value = utility.handler
    .handleColor(theme('placeholderColor'))
    .handleVariable().value;
  if (value) {
    if (['transparent', 'currentColor'].includes(value) || value.startsWith('var')) return new Property('color', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderColor', order: pluginOrder['placeholderColor'] + 1 });
    const rgb = value.startsWith('var') ? value : toRGB(value)?.join(', ');
    return [
      ...config('prefixer') ? [
        new Style(utility.class, [
          new Property('--tw-placeholder-opacity', '1'),
          new Property('color', `rgba(${rgb}, var(--tw-placeholder-opacity))`),
        ]).pseudoElement('-webkit-input-placeholder').updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderColor', order: pluginOrder['placeholderColor'] + 2 }),
        new Style(utility.class, [
          new Property('--tw-placeholder-opacity', '1'),
          new Property('color', `rgba(${rgb}, var(--tw-placeholder-opacity))`),
        ]).pseudoElement('-moz-placeholder').updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderColor', order: pluginOrder['placeholderColor'] + 3 }),
        new Style(utility.class, [
          new Property('--tw-placeholder-opacity', '1'),
          new Property('color', `rgba(${rgb}, var(--tw-placeholder-opacity))`),
        ]).pseudoClass('-ms-input-placeholder').updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderColor', order: pluginOrder['placeholderColor'] + 4 }),
        new Style(utility.class, [
          new Property('--tw-placeholder-opacity', '1'),
          new Property('color', `rgba(${rgb}, var(--tw-placeholder-opacity))`),
        ]).pseudoElement('-ms-input-placeholder').updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderColor', order: pluginOrder['placeholderColor'] + 5 }),
      ]: [],
      new Style(utility.class, [
        new Property('--tw-placeholder-opacity', '1'),
        new Property('color', `rgba(${rgb}, var(--tw-placeholder-opacity))`),
      ]).pseudoElement('placeholder').updateMeta({ type: 'utilities', corePlugin: true, group: 'placeholderColor', order: pluginOrder['placeholderColor'] + 6 }),
    ];
  }
}

// https://tailwindcss.com/docs/background-color
// https://tailwindcss.com/docs/background-opacity
// https://tailwindcss.com/docs/background-position
// https://tailwindcss.com/docs/background-size
// https://tailwindcss.com/docs/background-image
function background(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.body;
  // handle background positions
  const positions = toType(theme('backgroundPosition'), 'object') as { [key: string]: string };
  if (Object.keys(positions).includes(body)) return new Property('background-position', positions[body]).updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundPosition', order: pluginOrder['backgroundPosition'] + 1 });
  // handle background sizes
  const sizes = toType(theme('backgroundSize'), 'object') as { [key: string]: string };
  if (Object.keys(sizes).includes(body)) return new Property('background-size', sizes[body]).updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundSize', order: pluginOrder['backgroundSize'] + 1 });
  // handle background image
  const images = toType(theme('backgroundImage'), 'object') as { [key: string]: string };
  if (Object.keys(images).includes(body)) {
    const prefixer = linearGradient(images[body]);
    if (Array.isArray(prefixer)) {
      return new Style(
        utility.class,
        prefixer.map((i) => new Property('background-image', i))
      ).updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundImage', order: pluginOrder['backgroundImage'] + 1 });
    }
    return new Property('background-image', prefixer).updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundImage', order: pluginOrder['backgroundImage'] + 2 });
  }
  // handle background opacity
  if (utility.raw.startsWith('bg-opacity'))
    return utility.handler
      .handleStatic(theme('backgroundOpacity'))
      .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
      .handleVariable()
      .createProperty('--tw-bg-opacity')
      ?.updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundOpacity', order: pluginOrder['backgroundOpacity'] + 1 });
  // handle background color
  const value = utility.handler
    .handleColor(theme('backgroundColor'))
    .handleVariable().value;
  if (value) {
    if (['transparent', 'currentColor'].includes(value) || value.startsWith('var')) return new Property('background-color', value).updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundColor', order: pluginOrder['backgroundColor'] + 1 });
    return new Style(utility.class, [
      new Property('--tw-bg-opacity', '1'),
      new Property(
        'background-color',
        `rgba(${toRGB(value)?.join(', ')}, var(--tw-bg-opacity))`
      ),
    ]).updateMeta({ type: 'utilities', corePlugin: true, group: 'backgroundColor', order: pluginOrder['backgroundColor'] + 2 });
  }
}

// https://tailwindcss.com/docs/gradient-color-stops from
function gradientColorFrom(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleColor(theme('gradientColorStops'))
    .handleVariable().value;
  if (value) {
    let rgb;
    switch (value) {
    case 'transparent':
      rgb = '0, 0, 0';
      break;
    case 'current':
      rgb = '255, 255, 255';
      break;
    default:
      rgb = value.startsWith('var') ? '255, 255, 255' : toRGB(value)?.join(', ');
    }
    return new Style(utility.class, [
      new Property('--tw-gradient-from', value),
      new Property(
        '--tw-gradient-stops',
        `var(--tw-gradient-from), var(--tw-gradient-to, rgba(${rgb}, 0))`
      ),
    ]);
  }
}

// https://tailwindcss.com/docs/gradient-color-stops via
function gradientColorVia(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleColor(theme('gradientColorStops'))
    .handleVariable().value;
  if (value) {
    let rgb;
    switch (value) {
    case 'transparent':
      rgb = '0, 0, 0';
      break;
    case 'current':
      rgb = '255, 255, 255';
      break;
    default:
      rgb = value.startsWith('var') ? '255, 255, 255' : toRGB(value)?.join(', ');
    }
    return new Property(
      '--tw-gradient-stops',
      `var(--tw-gradient-from), ${value}, var(--tw-gradient-to, rgba(${rgb}, 0))`
    );
  }
}

// https://tailwindcss.com/docs/gradient-color-stops to
function gradientColorTo(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleColor(theme('gradientColorStops'))
    .handleVariable()
    .createProperty('--tw-gradient-to');
}

// https://tailwindcss.com/docs/border-radius
function borderRadius(utility: Utility, { theme }: PluginUtils): Output {
  const raw = [
    'rounded',
    'rounded-t',
    'rounded-l',
    'rounded-r',
    'rounded-b',
    'rounded-tl',
    'rounded-tr',
    'rounded-br',
    'rounded-bl',
  ].includes(utility.raw)
    ? utility.raw + '-DEFAULT'
    : utility.raw;
  utility = new Utility(raw);
  const directions = expandDirection(
    utility.center.replace(/-?\$[\w-]+/, ''),
    true
  );
  if (!directions) return;
  return utility.handler
    .handleStatic(theme('borderRadius'))
    .handleNxl((number: number) => `${number * 0.5}rem`)
    .handleSize()
    .handleVariable()
    .createProperty(
      directions[0] === '*'
        ? 'border-radius'
        : directions.map((i) => `border-${i}-radius`)
    );
}

// https://tailwindcss.com/docs/border-width
// https://tailwindcss.com/docs/border-color
// https://tailwindcss.com/docs/border-opacity
function border(utility: Utility, { theme }: PluginUtils): Output {
  // handle border opacity
  if (utility.raw.startsWith('border-opacity'))
    return utility.handler
      .handleStatic(theme('borderOpacity'))
      .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
      .handleVariable()
      .createProperty('--tw-border-opacity');

  // handle border color
  const value = utility.handler
    .handleColor(theme('borderColor'))
    .handleVariable((variable: string) => utility.raw.startsWith('border-$') ? `var(--${variable})` : undefined).value;
  if (value) {
    if (['transparent', 'currentColor'].includes(value))
      return new Property('border-color', value);
    return new Style(utility.class, [
      new Property('--tw-border-opacity', '1'),
      new Property(
        'border-color',
        value.startsWith('var') ? value: `rgba(${toRGB(value)?.join(', ')}, var(--tw-border-opacity))`
      ),
    ]);
  }
  // handle border width
  const directions = expandDirection(utility.raw.substring(7, 8), false) ?? [
    '*',
  ];
  const borders = (toType(theme('borderWidth'), 'object') ?? {}) as {
    [key: string]: string;
  };
  const raw = [
    'border',
    'border-t',
    'border-r',
    'border-b',
    'border-l',
  ].includes(utility.raw)
    ? `${utility.raw}-${borders.DEFAULT ?? '1px'}`
    : utility.raw;
  return new Utility(raw).handler
    .handleStatic(borders)
    .handleNumber(0, undefined, 'int', (number: number) => `${number}px`)
    .handleSize()
    .handleVariable()
    .createProperty(
      directions[0] === '*'
        ? 'border-width'
        : directions.map((i) => `border-${i}-width`)
    );
}

// https://tailwindcss.com/docs/divide-width
// https://tailwindcss.com/docs/divide-color
// https://tailwindcss.com/docs/divide-opacity
// https://tailwindcss.com/docs/divide-style
function divide(utility: Utility, { theme }: PluginUtils): Output {
  // handle divide style
  if (['solid', 'dashed', 'dotted', 'double', 'none'].includes(utility.amount))
    return new Property('border-style', utility.amount)
      .toStyle(utility.class)
      .child('> :not([hidden]) ~ :not([hidden])');
  // handle divide opacity
  if (utility.raw.startsWith('divide-opacity'))
    return utility.handler
      .handleStatic(theme('divideOpacity'))
      .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
      .handleVariable()
      .createProperty('--tw-divide-opacity');
  // handle divide color
  let value = utility.handler
    .handleColor(theme('divideColor'))
    .handleVariable((variable: string) =>
      utility.raw.startsWith('divide-$') ? `var(--${variable})` : undefined
    ).value;
  if (value) {
    if (['transparent', 'currentColor'].includes(value))
      return new Property('border-color', value);
    return new Style(utility.class, [
      new Property('--tw-divide-opacity', '1'),
      new Property(
        'border-color',
        value.startsWith('var') ? value : `rgba(${toRGB(value)?.join(', ')}, var(--tw-divide-opacity))`
      ),
    ]).child('> :not([hidden]) ~ :not([hidden])');
  }
  // handle divide width
  switch (utility.raw) {
  case 'divide-x-reverse':
    return new Style(
      utility.class,
      new Property('--tw-divide-x-reverse', '1')
    ).child('> :not([hidden]) ~ :not([hidden])');
  case 'divide-y-reverse':
    return new Style(
      utility.class,
      new Property('--tw-divide-y-reverse', '1')
    ).child('> :not([hidden]) ~ :not([hidden])');
  case 'divide-y':
    return new Style(utility.class, [
      new Property('--tw-divide-y-reverse', '0'),
      new Property(
        'border-top-width',
        'calc(1px * calc(1 - var(--tw-divide-y-reverse)))'
      ),
      new Property(
        'border-bottom-width',
        'calc(1px * var(--tw-divide-y-reverse))'
      ),
    ]).child('> :not([hidden]) ~ :not([hidden])');
  case 'divide-x':
    return new Style(utility.class, [
      new Property('--tw-divide-x-reverse', '0'),
      new Property(
        'border-right-width',
        'calc(1px * var(--tw-divide-x-reverse))'
      ),
      new Property(
        'border-left-width',
        'calc(1px * calc(1 - var(--tw-divide-x-reverse)))'
      ),
    ]).child('> :not([hidden]) ~ :not([hidden])');
  }
  value = utility.handler
    .handleNumber(0, undefined, 'float', (number: number) => `${number}px`)
    .handleSize()
    .handleVariable().value;
  if (value) {
    const centerMatch = utility.raw.match(/^-?divide-[x|y]/);
    if (centerMatch) {
      const center = centerMatch[0].replace(/^-?divide-/, '');
      switch (center) {
      case 'x':
        return new Style(utility.class, [
          new Property('--tw-divide-x-reverse', '0'),
          new Property(
            'border-right-width',
            `calc(${value} * var(--tw-divide-x-reverse))`
          ),
          new Property(
            'border-left-width',
            `calc(${value} * calc(1 - var(--tw-divide-x-reverse)))`
          ),
        ]).child('> :not([hidden]) ~ :not([hidden])');
      case 'y':
        return new Style(utility.class, [
          new Property('--tw-divide-y-reverse', '0'),
          new Property(
            'border-top-width',
            `calc(${value} * calc(1 - var(--tw-divide-y-reverse)))`
          ),
          new Property(
            'border-bottom-width',
            `calc(${value} * var(--tw-divide-y-reverse))`
          ),
        ]).child('> :not([hidden]) ~ :not([hidden])');
      }
    }
  }
}

// https://tailwindcss.com/docs/ring-offset-width
// https://tailwindcss.com/docs/ring-offset-color
function ringOffset(utility: Utility, { theme }: PluginUtils): Output {
  let value;
  // handle ring offset width variable
  if (utility.raw.startsWith('ringOffset-width-$')) {
    value = utility.handler.handleVariable().value;
    if (value)
      return new Property('--tw-ring-offset-width', value).toStyle(utility.class.replace('ringOffset', 'ring-offset'));
  }

  // handle ring offset width
  if (utility.center === '') {
    value = utility.handler
      .handleStatic(theme('ringOffsetWidth'))
      .handleNumber(0, undefined, 'float', (number: number) => `${number}px`)
      .handleSize().value;
    if (value)
      return new Property('--tw-ring-offset-width', value).toStyle(utility.class.replace('ringOffset', 'ring-offset'));
  }

  // handle ring offset color
  value = utility.handler.handleColor(theme('ringOffsetColor')).handleVariable().value;
  if (value)
    return new Property('--tw-ring-offset-color', value).toStyle(utility.class.replace('ringOffset', 'ring-offset'));
}

// https://tailwindcss.com/docs/ring-width
// https://tailwindcss.com/docs/ring-color
// https://tailwindcss.com/docs/ring-opacity
function ring(utility: Utility, utils: PluginUtils): Output {
  // handle ring offset
  if (utility.raw.startsWith('ring-offset'))
    return ringOffset(
      new Utility(utility.raw.replace('ring-offset', 'ringOffset')), utils);
  // handle ring opacity
  if (utility.raw.startsWith('ring-opacity'))
    return utility.handler
      .handleStatic(utils.theme('ringOpacity'))
      .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
      .handleVariable()
      .createProperty('--tw-ring-opacity');
  // handle ring color
  let value = utility.handler
    .handleColor(utils.theme('ringColor'))
    .handleVariable((variable: string) =>
      utility.raw.startsWith('ring-$') ? `var(--${variable})` : undefined
    ).value;
  if (value) {
    if (['transparent', 'currentColor'].includes(value) || value.startsWith('var'))
      return new Style(utility.class, [
        new Property('--tw-ring-color', value),
      ]);
    return new Style(utility.class, [
      new Property('--tw-ring-opacity', '1'),
      new Property(
        '--tw-ring-color',
        `rgba(${toRGB(value)?.join(', ')}, var(--tw-ring-opacity))`),
    ]
    );
  }
  // handle ring width
  if (utility.raw === 'ring-inset')
    return new Property('--tw-ring-inset', 'inset');
  if (utility.raw === 'ring')
    value = toType(utils.theme('ringWidth.DEFAULT'), 'string') ?? '3px';
  value = utility.handler
    .handleStatic(utils.theme('ringWidth'))
    .handleNumber(0, undefined, 'float', (number: number) => `${number}px`)
    .handleSize()
    .handleVariable().value;
  if (value)
    return new Style(utility.class, [
      new Property('--tw-ring-offset-shadow', 'var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)'),
      new Property('--tw-ring-shadow', `var(--tw-ring-inset) 0 0 0 calc(${value} + var(--tw-ring-offset-width)) var(--tw-ring-color)`),
      new Property(['-webkit-box-shadow', 'box-shadow'], 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)'),
    ]);
}

// https://tailwindcss.com/docs/box-shadow/
function boxShadow(utility: Utility, { theme }: PluginUtils): Output {
  let body = utility.body;
  if (body === '') body = 'DEFAULT';
  const shadows = toType(theme('boxShadow'), 'object') as {
    [key: string]: string;
  };
  if (Object.keys(shadows).includes(body)) {
    return new Style(utility.class, [
      new Property('--tw-shadow', shadows[body]),
      new Property(
        ['-webkit-box-shadow', 'box-shadow'],
        'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)'
      ),
    ]);
  }
}

// https://tailwindcss.com/docs/opacity
function opacity(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('opacity'))
    .handleNumber(0, 100, 'int', (number: number) => (number / 100).toString())
    .handleVariable()
    .createProperty('opacity');
}

// https://tailwindcss.com/docs/transition-property
function transition(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.body;
  const props = (toType(theme('transitionProperty'), 'object') ?? {}) as {
    [key: string]: string;
  };
  for (const [key, value] of Object.entries(props)) {
    if (body === key || (body === '' && key === 'DEFAULT')) {
      if (value === 'none')
        return new Property(
          [
            '-webkit-transition-property',
            '-o-transition-property',
            'transition-property',
          ],
          'none'
        );
      return new Style(utility.class, [
        new Property(
          '-webkit-transition-property',
          value.replace(/(?=(transform|box-shadow))/g, '-webkit-')
        ),
        new Property('-o-transition-property', value),
        new Property(
          'transition-property',
          value
            .replace(/transform/g, 'transform, -webkit-transform')
            .replace(/box-shadow/g, 'box-shadow, -webkit-box-shadow')
        ),
        new Property(
          [
            '-webkit-transition-timing-function',
            '-o-transition-timing-function',
            'transition-timing-function',
          ],
          toType(theme('transitionTimingFunction.DEFAULT'), 'string') ??
            'cubic-bezier(0.4, 0, 0.2, 1)'
        ),
        new Property(
          [
            '-webkit-transition-duration',
            '-o-transition-duration',
            'transition-duration',
          ],
          toType(theme('transitionDuration.DEFAULT'), 'string') ?? '150ms'
        ),
      ]);
    }
  }
}

// https://tailwindcss.com/docs/transition-duration
function duration(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('transitionDuration'))
    .handleNumber(0, undefined, 'int', (number: number) => `${number}ms`)
    .handleVariable()
    .createProperty([
      '-webkit-transition-duration',
      '-o-transition-duration',
      'transition-duration',
    ]);
}

// https://tailwindcss.com/docs/transition-timing-function
function transitionTimingFunction(
  utility: Utility,
  { theme }: PluginUtils
): Output {
  return utility.handler
    .handleBody(theme('transitionTimingFunction'))
    .createProperty([
      '-webkit-transition-timing-function',
      '-o-transition-timing-function',
      'transition-timing-function',
    ]);
}

// https://tailwindcss.com/docs/transition-delay
function delay(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('transitionDelay'))
    .handleNumber(0, undefined, 'int', (number: number) => `${number}ms`)
    .handleVariable()
    .createProperty([
      '-webkit-transition-delay',
      '-o-transition-delay',
      'transition-delay',
    ]);
}

// https://tailwindcss.com/docs/animation
function animation(utility: Utility, { theme, config }: PluginUtils): Output {
  const animations = (toType(theme('animation'), 'object') ?? {}) as {
    [key: string]: string;
  };
  if (Object.keys(animations).includes(utility.body)) {
    const value = animations[utility.body];
    const keyframe = value.match(/^\w+/)?.[0];
    const prop = config('prefixer') ? ['-webkit-animation', 'animation'] : 'animation';
    if (value === 'none') return new Property(prop, 'none');
    return [
      new Style(utility.class, new Property(prop, value)),
      ... keyframe ? Keyframes.generate(
        keyframe,
        (theme(`keyframes.${keyframe}`) ?? {}) as {
          [key: string]: { [key: string]: string };
        },
        undefined,
        config('prefixer', false) as boolean
      ) : [],
    ];
  }
}

// https://tailwindcss.com/docs/transform-origin
function transformOrigin(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.body;
  const origins = (toType(theme('transformOrigin'), 'object') ?? {}) as {
    [key: string]: string;
  };
  if (Object.keys(origins).includes(body)) {
    return new Property(
      ['-webkit-transform-origin', '-ms-transform-origin', 'transform-origin'],
      origins[body]
    );
  }
}

// https://tailwindcss.com/docs/scale
function scale(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.handler
    .handleStatic(theme('scale'))
    .handleNumber(0, undefined, 'int', (number: number) =>
      (number / 100).toString()
    )
    .handleVariable()
    .value;
  if (!value) return;
  if (utility.raw.startsWith('scale-x')) return new Property('--tw-scale-x', value);
  if (utility.raw.startsWith('scale-y')) return new Property('--tw-scale-y', value);
  return new Property(['--tw-scale-x', '--tw-scale-y'], value);
}

// https://tailwindcss.com/docs/rotate
function rotate(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleStatic(theme('rotate'))
    .handleNumber(0, undefined, 'float', (number: number) => `${number}deg`)
    .handleNegative()
    .handleVariable()
    .createProperty('--tw-rotate');
}

// https://tailwindcss.com/docs/translate
function translate(utility: Utility, { theme }: PluginUtils): Output {
  const centerMatch = utility.raw.match(/^-?translate-[x|y]/);
  if (centerMatch) {
    const center = centerMatch[0].replace(/^-?translate-/, '');
    return utility.handler
      .handleStatic(theme('translate'))
      .handleSpacing()
      .handleFraction()
      .handleSize()
      .handleNegative()
      .handleVariable()
      .createProperty(`--tw-translate-${center}`);
  }
}

// https://tailwindcss.com/docs/skew
function skew(utility: Utility, { theme }: PluginUtils): Output {
  const centerMatch = utility.raw.match(/^-?skew-[x|y]/);
  if (centerMatch) {
    const center = centerMatch[0].replace(/^-?skew-/, '');
    return utility.handler
      .handleStatic(theme('skew'))
      .handleNumber(0, undefined, 'float', (number: number) => `${number}deg`)
      .handleNegative()
      .handleVariable()
      .createProperty(`--tw-skew-${center}`);
  }
}

// https://tailwindcss.com/docs/cursor
function cursor(utility: Utility, { theme }: PluginUtils): Output {
  const body = utility.body;
  const cursors = (toType(theme('cursor'), 'object') ?? {}) as {
    [key: string]: string;
  };
  if (Object.keys(cursors).includes(body))
    return new Property('cursor', cursors[body]);
}

// https://tailwindcss.com/docs/outline
function outline(utility: Utility, { theme }: PluginUtils): Output {
  const amount = utility.amount;
  const staticMap = (toType(theme('outline'), 'object') ?? {}) as {
    [key: string]: [outline: string, outlineOffset: string];
  };
  if (Object.keys(staticMap).includes(amount))
    return new Style(utility.class, [
      new Property('outline', staticMap[amount][0]),
      new Property('outline-offset', staticMap[amount][1]),
    ]);

  let value = utility.handler
    .handleColor()
    .handleVariable((variable: string) =>
      utility.raw.startsWith('outline-$') ? `var(--${variable})` : undefined
    ).value;
  if (value)
    return new Style(utility.class, [
      new Property(
        'outline',
        `2px ${value === 'transparent' ? 'solid' : 'dotted'} ${value}`
      ),
      new Property('outline-offset', '2px'),
    ]);
  if (utility.raw.match(/^outline-(solid|dotted)/)) {
    const newUtility = new Utility(utility.raw.replace('outline-', ''));
    value = newUtility.handler
      .handleStatic({ none: 'transparent', white: 'white', black: 'black' })
      .handleColor()
      .handleVariable().value;
    if (value)
      return new Style(utility.class, [
        new Property('outline', `2px ${newUtility.identifier} ${value}`),
        new Property('outline-offset', '2px'),
      ]);
  }
}

// https://tailwindcss.com/docs/fill
function fill(utility: Utility, { theme }: PluginUtils): Output {
  return utility.handler
    .handleColor(theme('fill'))
    .handleVariable()
    .createProperty('fill');
}

// https://tailwindcss.com/docs/stroke
// https://tailwindcss.com/docs/stroke-width
function stroke(utility: Utility, { theme }: PluginUtils): Output {
  const value = utility.raw.startsWith('stroke-$')
    ? utility.handler.handleVariable().createProperty('stroke-width')
    : utility.handler
      .handleStatic(theme('strokeWidth'))
      .handleNumber(0, undefined, 'int')
      .createProperty('stroke-width');
  return (
    value ??
    utility.handler
      .handleColor(theme('stroke'))
      .handleVariable()
      .createProperty('stroke')
  );
}

export const dynamicUtilities: DynamicUtility = {
  container: container,
  space: space,
  divide: divide,
  bg: background,
  from: gradientColorFrom,
  via: gradientColorVia,
  to: gradientColorTo,
  border: border,
  rounded: borderRadius,
  cursor: cursor,
  flex: flex,
  order: order,
  font: font,
  h: size,
  leading: lineHeight,
  list: listStyleType,
  m: margin,
  my: margin,
  mx: margin,
  mt: margin,
  mr: margin,
  mb: margin,
  ml: margin,
  min: minMaxSize,
  max: minMaxSize,
  object: objectPosition,
  opacity: opacity,
  outline: outline,
  p: padding,
  py: padding,
  px: padding,
  pt: padding,
  pr: padding,
  pb: padding,
  pl: padding,
  placeholder: placeholder,
  inset: inset,
  top: inset,
  right: inset,
  bottom: inset,
  left: inset,
  shadow: boxShadow,
  ring: ring,
  fill: fill,
  stroke: stroke,
  text: text,
  tracking: letterSpacing,
  w: size,
  z: zIndex,
  gap: gap,
  auto: gridAuto,
  grid: gridTemplate,
  col: gridColumn,
  row: gridRow,
  origin: transformOrigin,
  scale: scale,
  rotate: rotate,
  translate: translate,
  skew: skew,
  transition: transition,
  ease: transitionTimingFunction,
  duration: duration,
  delay: delay,
  animate: animation,
};
