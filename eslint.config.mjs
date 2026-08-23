/** Next.js ve TypeScript kurallarini generated dosyalari dislayarak uygular. */
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [
  // Next 16 dogrudan flat config sundugu icin uyumluluk katmani gereksizdir.
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // next-env.d.ts Next.js tarafindan uretilir ve elle duzenlenmez.
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

export default eslintConfig;
