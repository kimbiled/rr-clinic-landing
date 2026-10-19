import type { ReactNode } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, type ThemeConfig } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { antdTheme } from './antdTheme';

/**
 * Ant Design scope. antd is only used by lazily loaded parts (surgeon menu, team section), so each
 * of them wraps itself in this provider instead of the app root — that keeps antd out of the
 * first-paint bundle. `layer` puts antd styles into @layer antd so Tailwind utilities win.
 */
export function AntdProvider({ children, theme = antdTheme }: { children: ReactNode; theme?: ThemeConfig }) {
  return (
    <StyleProvider layer>
      <ConfigProvider theme={theme} locale={ruRU}>
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
