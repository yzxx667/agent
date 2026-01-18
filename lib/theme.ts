import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // 主色调 - 使用现代蓝色渐变
    colorPrimary: '#3b82f6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    // 背景色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBgBase: '#ffffff',

    // 文字颜色
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    colorTextQuaternary: '#cbd5e1',

    // 边框颜色
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',

    // 字体
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusXS: 4,

    // 阴影
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    boxShadowTertiary: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,
    margin: 16,
    marginLG: 24,
    marginXL: 32,

    // 线条
    lineWidth: 1,
    lineType: 'solid',

    // 动画
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.15s',

    // 控制高度
    controlHeight: 36,
    controlHeightLG: 44,
    controlHeightSM: 28,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: '#ffffff',
      bodyBg: '#ffffff',
      triggerBg: '#ffffff',
      triggerColor: '#64748b',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#eff6ff',
      itemHoverBg: '#f8fafc',
      subMenuItemBg: 'transparent',
      itemHeight: 44,
      itemMarginBlock: 2,
      itemMarginInline: 12,
      itemBorderRadius: 8,
      collapsedWidth: 80,
      iconSize: 18,
      fontSize: 14,
      fontWeightStrong: 500,
      itemColor: '#64748b',
      itemSelectedColor: '#3b82f6',
      itemHoverColor: '#3b82f6',
    },
    Card: {
      headerBg: '#ffffff',
      paddingLG: 24,
      borderRadiusLG: 12,
      boxShadowTertiary: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      headerSortActiveBg: '#f1f5f9',
      borderColor: '#f1f5f9',
      rowHoverBg: '#f8fafc',
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      fontWeight: 500,
      primaryShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
      defaultShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      paddingBlock: 8,
      paddingInline: 12,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    Breadcrumb: {
      fontSize: 14,
      itemColor: '#64748b',
      lastItemColor: '#1e293b',
      linkColor: '#64748b',
      linkHoverColor: '#3b82f6',
      separatorColor: '#94a3b8',
    },
    Typography: {
      titleMarginBottom: 0,
      titleMarginTop: 0,
    },
  },
};

export const darkTheme: ThemeConfig = {
  ...theme,
  algorithm: 'darkAlgorithm' as any,
  token: {
    ...theme.token,
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#000000',
    colorText: '#ffffff',
    colorTextSecondary: '#a6a6a6',
  },
};
