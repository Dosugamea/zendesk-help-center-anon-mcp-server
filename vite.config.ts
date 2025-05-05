import { resolve } from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json"; // package.json をインポート (tsconfig.json で resolveJsonModule: true が必要かも)
import builtins from "builtin-modules"; // Node.js組み込みモジュールリスト (要インストール: npm i -D builtin-modules)

export default defineConfig({
  build: {
    target: "node20",
    outDir: "dist", // Output directory
    sourcemap: true,
    ssr: true, // Node.jsサーバーのビルドに適した設定
    rollupOptions: {
      // input でエントリーポイントを指定
      input: resolve(__dirname, "src/server.ts"),
      output: {
        // 出力フォーマットを Node.js 環境に合わせて指定
        // Node.js v14以降で package.json に "type": "module" があれば 'es'
        // そうでなければ 'cjs' が一般的
        format: "es", // または 'cjs'
        // 出力ファイル名を指定 (必要に応じて)
        // entryFileNames: 'server.js',
      },
      external: [
        ...builtins, // Node.js 組み込みモジュールを全てexternalに
        ...Object.keys(pkg.dependencies || {}), // package.jsonのdependenciesをexternalに
        // devDependencies を external に含めるかは、ビルド後の実行に必要かどうかで判断
        // ...Object.keys(pkg.devDependencies || {}),
      ],
    },
  },
  plugins: [tsconfigPaths()],
});
