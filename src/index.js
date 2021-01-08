const fs = require('fs');

const readFile = (path) => {
  return fs.readFileSync(path, 'utf-8');
};

const getAssetsTooLarge = (assets) => {
  const recommendedSize = 244;
  const largeAssets = assets.map((asset) => {
    const { name, size } = asset;
    if (!name.endsWith('.js')) {
      return undefined;
    }
    const sizeInKiB = Math.round(size / 1024);
    if (sizeInKiB > recommendedSize) {
      return { name, size: sizeInKiB > 1024 ? `${(sizeInKiB / 1024).toFixed(2)} MiB` : `${sizeInKiB} KiB` };
    }
  }).filter(Boolean);

  let suggestion = '';
  if (largeAssets.length > 0) {
    suggestion = 'The following asset(s) exceed the recommended size limit (244 KiB).\n' +
                'This can impact web performance.\nAssets:\n' +
                largeAssets.map(({ name, size }) => `${name} (${size})`).join('\n')
  }

  return suggestion;
};

const getModulesCouldBeAsync = (chunk, modules) => {

};

const analyze = (content) => {
  const data = JSON.parse(content);
  const { assets, chunks } = data;
  const suggestions = [
    getAssetsTooLarge(assets)
  ].join('-----------------\n');
  return suggestions;
};

const exampleFilePath = './example/stats.json';
const fileContent = readFile(exampleFilePath);
const suggestions = analyze(fileContent);
console.log(suggestions);