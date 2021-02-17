import { resolve } from "path";
import { toType } from "../../src/utils/tools";
import { Processor } from "../../src/lib";

const configPath = resolve("./test/assets/tailwind.config.js");
const userConfig = require(configPath);

describe("Config", () => {
  const baseConfig = new Processor();

  it("dict input", () => {
    const processor = new Processor(userConfig);
    expect(processor.config("theme.screens")).toEqual(
      processor.theme("screens")
    );
    expect(processor.theme("screens")).toEqual(userConfig.theme.screens);
    expect(processor.theme("colors")).toEqual(userConfig.theme.colors);
    expect(processor.theme("colors.pink")).toEqual(
      userConfig.theme.colors.pink
    );
    expect(processor.theme("fontFamily")).toEqual(userConfig.theme.fontFamily);
    expect(processor.theme("spacing")).toEqual({
      ...(toType(baseConfig.theme("spacing"), "object") ?? {}),
      ...userConfig.theme.extend.spacing,
    });
    expect(processor.theme("borderRadius")).toEqual({
      ...(toType(baseConfig.theme("borderRadius"), "object") ?? {}),
      ...userConfig.theme.extend.borderRadius,
    });
  });

  it("resolveConfig should extend correctly", () => {
    const processor = new Processor({
      theme: {
        extend: {
          order: {
            'lg': '44',
          },
          lineClamp: {
            sm: '4',
            lg: '9',
          }
        }
      }
    });
    expect(processor.theme('order')).toEqual({
      first: "-9999",
      last: "9999",
      none: "0",
      lg: "44"
    });
    expect(processor.theme('lineClamp')).toEqual({ sm: '4', lg: '9' });
  })

  it("resolveConfig should not overwrite theme function", () => {
    const processor = new Processor({
      theme: {
        extend: {
          width: {
            '1/7': '14%',
            '2/7': '28%',
            '3/7': '42%',
            '4/7': '57%',
            '5/7': '71%',
            '6/7': '85%',
          }
        }
      }
    });
    expect(processor.theme('width')).toEqual({
      auto: 'auto',
      px: '1px',
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
      '2xl': '42rem',
      '3xl': '48rem',
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      prose: '65ch',
      screen: '100vw',
      'screen-sm': '640px',
      'screen-md': '768px',
      'screen-lg': '1024px',
      'screen-xl': '1280px',
      'screen-2xl': '1536px',
      '1/7': '14%',
      '2/7': '28%',
      '3/7': '42%',
      '4/7': '57%',
      '5/7': '71%',
      '6/7': '85%'
    })
  });

  it("change separator test", () => {
    const processor = new Processor({ separator: "_" });
    expect(processor.interpret("sm_bg-black").styleSheet.build()).toBe(
      "@media (min-width: 640px) {\n  .sm_bg-black {\n    --tw-bg-opacity: 1;\n    background-color: rgba(0, 0, 0, var(--tw-bg-opacity));\n  }\n}"
    );
  });

  it("add prefix test", () => {
    const processor = new Processor({ prefix: "tw-" });
    expect(processor.interpret("sm:tw-bg-black").styleSheet.build()).toBe(
      "@media (min-width: 640px) {\n  .sm\\:tw-bg-black {\n    --tw-bg-opacity: 1;\n    background-color: rgba(0, 0, 0, var(--tw-bg-opacity));\n  }\n}"
    );
  });

  it("important test", () => {
    const processor = new Processor({ important: true });
    expect(processor.interpret("sm:bg-black").styleSheet.build()).toBe(
      "@media (min-width: 640px) {\n  .sm\\:bg-black {\n    --tw-bg-opacity: 1 !important;\n    background-color: rgba(0, 0, 0, var(--tw-bg-opacity)) !important;\n  }\n}"
    );
  });

  it("important string test", () => {
    const processor = new Processor({ important: "#app" });
    expect(processor.interpret("sm:bg-black").styleSheet.build()).toBe(
      "@media (min-width: 640px) {\n  #app .sm\\:bg-black {\n    --tw-bg-opacity: 1;\n    background-color: rgba(0, 0, 0, var(--tw-bg-opacity));\n  }\n}"
    );
    expect(processor.interpret("dark:bg-white").styleSheet.build()).toBe(
      ".dark #app .dark\\:bg-white {\n  --tw-bg-opacity: 1;\n  background-color: rgba(255, 255, 255, var(--tw-bg-opacity));\n}"
    );
  });

  it("color config test", () => {
    const processor = new Processor({
      darkMode: 'media', // or 'media' or 'class'
      theme: {
        extend: {
          colors: {
            darkTheme: {
              600: '#262A34',
              700: '#181A20',
              800: '#1A1B20',
            },
          },
        },
      },
    });
    expect(processor.theme('colors.darkTheme')).toEqual({
      600: '#262A34',
      700: '#181A20',
      800: '#1A1B20',
    });
    expect(processor.interpret('bg-darkTheme-600').styleSheet.build()).toEqual(
`.bg-darkTheme-600 {
  --tw-bg-opacity: 1;
  background-color: rgba(38, 42, 52, var(--tw-bg-opacity));
}`);
  });

  it("handle colors test", () => {
    const processor = new Processor({
      theme: {
        extend: {
          colors: {
            discord: {
              DEFAULT: '#7289da',
              '100': '#7289da'
            },
            'primary-color-red': '#FF0000'
          }
        }
      }
    });
    expect(processor.interpret('bg-discord bg-discord-100 bg-hex-7289da ring-offset-hex-1c1c1e ring-offset-gray-200 text-primary-color-red').styleSheet.build()).toEqual(`.bg-discord {
  --tw-bg-opacity: 1;
  background-color: rgba(114, 137, 218, var(--tw-bg-opacity));
}
.bg-discord-100 {
  --tw-bg-opacity: 1;
  background-color: rgba(114, 137, 218, var(--tw-bg-opacity));
}
.bg-hex-7289da {
  --tw-bg-opacity: 1;
  background-color: rgba(114, 137, 218, var(--tw-bg-opacity));
}
.ring-offset-hex-1c1c1e {
  --tw-ring-offset-color: #1c1c1e;
}
.ring-offset-gray-200 {
  --tw-ring-offset-color: #e5e7eb;
}
.text-primary-color-red {
  --tw-text-opacity: 1;
  color: rgba(255, 0, 0, var(--tw-text-opacity));
}`);
  });
});
