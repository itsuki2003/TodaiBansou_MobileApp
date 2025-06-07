import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 東大伴走ブランドカラー
      colors: {
        // プライマリカラー（東大ブルーをベース）
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 教育・学習を表現する温かみのあるセカンダリカラー
        secondary: {
          50: '#fef7ee',
          100: '#feefd5',
          200: '#fcdcaa',
          300: '#f9c274',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        // 成功・完了を表現
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // 警告・注意を表現
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // エラー・緊急を表現
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      // フォントファミリー
      fontFamily: {
        sans: [
          'Hiragino Kaku Gothic ProN',
          'Hiragino Sans',
          'BIZ UDPGothic',
          'Meiryo',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      // アニメーション
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      // グリッドシステム
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
      },
      // スペーシング
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // ボックスシャドウ
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 8px 0 rgba(0, 0, 0, 0.08)',
        'strong': '0 8px 16px 0 rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      // 画面サイズ
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      // Z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // トランジション
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    // フォーム要素のスタイリング改善
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    // タイポグラフィーの改善
    require('@tailwindcss/typography'),
    // アスペクト比のユーティリティ
    require('@tailwindcss/aspect-ratio'),
    // カスタムプラグイン: 教育プラットフォーム特有のユーティリティ
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        // 学習進捗表示用のプログレスバー
        '.progress-bar': {
          'background-color': theme('colors.gray.200'),
          'border-radius': theme('borderRadius.full'),
          'overflow': 'hidden',
          'height': theme('spacing.2'),
        },
        '.progress-fill': {
          'background-color': theme('colors.primary.500'),
          'height': '100%',
          'transition': 'width 0.3s ease-out',
        },
        // カードのホバーエフェクト
        '.card-interactive': {
          'transition': 'all 0.2s ease-out',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': theme('boxShadow.card-hover'),
          },
        },
        // バッジスタイル
        '.badge-status': {
          'display': 'inline-flex',
          'align-items': 'center',
          'padding': `${theme('spacing.1')} ${theme('spacing.3')}`,
          'border-radius': theme('borderRadius.full'),
          'font-size': theme('fontSize.xs'),
          'font-weight': '500',
        },
        // ボタンのフォーカススタイル
        '.btn-focus': {
          '&:focus': {
            'outline': 'none',
            'ring-width': '2px',
            'ring-color': theme('colors.primary.500'),
            'ring-offset-width': '2px',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

export default config