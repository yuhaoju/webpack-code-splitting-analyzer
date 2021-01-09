# webpack-code-splitting-analyzer

This is a tool to analyze Webpack bundle and give suggestions on code splitting.

## How to install

`npm install --save-dev webpack-code-splitting-analyzer` or `yarn add webpack-code-splitting-analyzer --dev`
## Commands

- `npx wcsa stats test/stats.json` - Analyze Webpack bundle profile and give code splitting suggestions
- `npx wcsa packages package.json` - Analyze packages that have not been updated for a long time
