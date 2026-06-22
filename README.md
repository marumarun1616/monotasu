# モノタス by MonotaRO

現場で止まらない一式を、先回りで提示するAIサービス。

## デプロイ方法（Vercel）

1. このリポジトリをGitHubにpush
2. https://vercel.com でGitHubと連携してインポート
3. Environment Variablesに以下を設定：
   - `ANTHROPIC_API_KEY` = あなたのAnthropicAPIキー
4. Deploy

## ローカル開発

```bash
npm i -g vercel
vercel dev
```
