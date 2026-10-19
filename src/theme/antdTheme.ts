import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

/** Ant Design theme mapped onto the RR Clinic tokens (css: src/styles/index.css @theme). */
export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  cssVar: { prefix: 'rr' },
  token: {
    colorPrimary: '#c19457',
    colorInfo: '#c19457',
    colorBgBase: '#291d10',
    colorTextBase: '#f6f3f0',
    colorBgElevated: 'rgba(41, 29, 16, 0.96)',
    borderRadius: 14,
    fontFamily: '"Futura PT", "Century Gothic", system-ui, sans-serif',
    motionEaseOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
};
