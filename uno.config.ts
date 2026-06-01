// uno.config.ts
import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetUno,
  // presetWebFonts,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

export default defineConfig({
  variants: [
    // 在 rtl 情况下把 ml 转 mr、pl 转 pr
    (matcher: any) => {
      const m = matcher.match(/^rtl:(.+)$/);
      if (m) {
        return {
          matcher: m[1],
          selector: (s: any) => `[dir="rtl"] .${s}`,
          parent: ''
        };
      }
    }
  ],
  rules: [
    [/^l-(\d+)$/, ([, d]) => ({ 'line-height': `${d}px` })],
    [/^color-(\w+)$/, ([, d]) => ({ color: `#${d}` })],
    [/^border-(\d+)px-(\w+)$/, ([, d, w]) => ({ border: `${d}px solid #${w}` })],
    [/^border-top-(\d+)px-(\w+)$/, ([, d, w]) => ({ 'border-top': `${d}px solid #${w}` })],
    [/^border-bottom-(\d+)px-(\w+)$/, ([, d, w]) => ({ 'border-bottom': `${d}px solid #${w}` })],
    [/^border-left-(\d+)px-(\w+)$/, ([, d, w]) => ({ 'border-left': `${d}px solid #${w}` })],
    [/^border-right-(\d+)px-(\w+)$/, ([, d, w]) => ({ 'border-right': `${d}px solid #${w}` })],
    [/^width-p-(\d+)$/, ([, d]) => ({ width: `${d}%` })],
    [/^height-p-(\d+)$/, ([, d]) => ({ height: `${d}%` })],
    [/^br-(\d+)$/, ([, d]) => ({ 'border-radius': `${d}px` })],
    [/^bg-color-(\w+)$/, ([, d]) => ({ 'background-color': `#${d}` })],
    [/^no-scrollbar$/, () => ({ 'scrollbar-width': 'none' })]
  ],
  shortcuts: [
    // ...
  ],
  theme: {
    colors: {
      primary: '#D80940',
      'info-40': '#458AF2',
      'info-50': '#0B6ADA',
      'info-60': '#075CC0',
      'error-40': '#E61546',
      'error-50': '#C31D40',
      'error-60': '#AE1435',
      'yellow-30': '#FED700',
      'yellow-40': '#FFB636',
      'yellow-50': '#FFA200',
      'yellow-60': '#F09000',
      'success-40': '#33CC00',
      'success-50': '#1CA63A',
      'success-60': '#1B9636',
      white: '#ffffff',
      'black-80': '#161A2C',
      'black-90': '#111423',
      'black-100': '#0D101C',
      'grey-20': '#9DA8E1',
      'grey-30': '#939ED3',
      'grey-40': '#6E76A0',
      'grey-50': '#555C7E',
      'grey-60': '#2A2F46',
      'grey-70': '#262B41',
      'grey-80': '#202439',
      'grey-100': '#1C2032',
      translucent: 'rgba(0, 0, 0, 0.54)'
    },
    breakpoints: {
      xs: '576px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1600px',
      xxxl: '3200px'
    }
  },
  // safelist: [...iconSafelist],
  presets: [
    presetUno(),
    presetAttributify(),
    // presetIcons({
    //   collections: {
    //     custom: () => customIcon,
    //     dice: () => diceIcon,
    //     options: () => optionsIcon,
    //     currency: () => currencyIcon,
    //     social: () => socialIcon,
    //     guideline: () => guidelineIcon
    //   }
    // }),
    presetTypography()
    // presetWebFonts({
    //   provider: 'google',
    //   fonts: {
    //     Kanit: 'Kanit',
    //     Montserrat: 'Montserrat'
    //     // ...
    //   }
    // })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()]
});
