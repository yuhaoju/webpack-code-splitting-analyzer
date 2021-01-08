const fs = require('fs');

const readFile = (path) => {
  return fs.readFileSync(path, 'utf-8');
};

const formatSize = (size) => {
  const sizeInKiB = Math.round(size / 1024);
  return sizeInKiB > 1024 ? `${(sizeInKiB / 1024).toFixed(2)} MiB` : `${sizeInKiB} KiB`;
};

const calculateSizeForPackage = (packageName, modules) => {
  let sum = 0;
  modules.forEach((module) => {
    const { name, size } = module;
    if (name.indexOf(`node_modules/${packageName}/`) > -1) {
      sum += size;
    }
  });
  return formatSize(sum);
}

const getAssetsTooLarge = (assets) => {
  const recommendedSize = 244;
  const largeAssets = assets.map((asset) => {
    const { name, size } = asset;
    if (!name.endsWith('.js')) {
      return undefined;
    }
    const sizeInKiB = Math.round(size / 1024);
    if (sizeInKiB > recommendedSize) {
      return { name, size: formatSize(size) };
    }
  }).filter(Boolean);

  let suggestion = '';
  if (largeAssets.length > 0) {
    suggestion = 'The following asset(s) exceed the recommended size limit (244 KiB):\n' +
                largeAssets.map(({ name, size }) => `- ${name} (${size})`).join('\n')
  }

  return suggestion;
};

const getModulesCanBeLoadedAsync = (chunks, modules) => {
  const thirdPartyModules = {};

  const checkIfRelevantChunksAllAsync = (module) => {
    if (!module) return true;

    const { chunks: relevantChunks } = module;
    return relevantChunks.every((relevantChunkId) => chunks[relevantChunkId].initial === false);
  }

  const checkIfModuleCanBeLoadedAsync = (module, debug) => {
    const { chunks: relevantChunks, name, reasons } = module;
    if (name.indexOf('node_modules/') > -1) {
      const pakcageNameReg = /node_modules\/((@[^/]+\/)?[^/]+)\//;
      const packageName = name.match(pakcageNameReg)[1];

      // TODO: check the "initial" field for "relevantChunks"
      // relevantChunks.forEach((relevantChunkId) => {
      //   console.log(chunks[relevantChunkId].names);
      // })

      // Check if the mudule can be loaded async
      const allRelevantModulesAreAsync = reasons.every((reason) => {
        const { module: reasonModule, moduleId: reasonModuleId } = reason;
        if (!reasonModule) return false; // not actually used
        if (reasonModule.indexOf(`node_modules/${packageName}`) > -1) return true; // don't count if imported by itself
        if (reasonModule.indexOf('node_modules/') > -1) return false; // TODO: this can be improved
        return checkIfRelevantChunksAllAsync(modules[reasonModuleId]);
      });

      if (allRelevantModulesAreAsync) {
        if (typeof thirdPartyModules[packageName] === 'undefined') {
          thirdPartyModules[packageName] = { async: true, size: calculateSizeForPackage(packageName, modules) };
        }
      } else {
        // this should override previous value, so no need to check undefined
        thirdPartyModules[packageName] = { async: false };;
      }
    }
  };

  modules.forEach(checkIfModuleCanBeLoadedAsync);
  const thirdPartyPackagesCanBeLoadedAsync = Object.keys(thirdPartyModules)
                                            .filter((name) => thirdPartyModules[name].async)
                                            .map((name) => ({ name, size: thirdPartyModules[name].size }));

  let suggestion = '';
  if (thirdPartyPackagesCanBeLoadedAsync.length > 0) {
    suggestion = 'The following third party package(s) can be loaded async:\n' +
                thirdPartyPackagesCanBeLoadedAsync.map(({ name, size }) => `- ${name} (${size})`).join('\n');
  }

  return suggestion;
};

const analyze = (content) => {
  const data = JSON.parse(content);
  const { assets, chunks, modules } = data;
  const suggestions = [
    getAssetsTooLarge(assets),
    getModulesCanBeLoadedAsync(chunks, modules),
  ].filter(Boolean).join('\n-----------------------\n');
  return suggestions;
};

const exampleFilePath = './example/stats.json';
const fileContent = readFile(exampleFilePath);
const suggestions = analyze(fileContent);
console.log(suggestions);
