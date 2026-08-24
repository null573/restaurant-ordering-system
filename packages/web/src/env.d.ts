/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// qrcode 库未随类型声明发布，统一在此声明，避免 TS7016
declare module 'qrcode';
