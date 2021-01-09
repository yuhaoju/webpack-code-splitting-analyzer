/* eslint no-console: 0 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const exec = (command) => {
  execSync(command, { stdio: 'inherit' });
};

const getCommitTime = (line) => {
  const commitTimeReg = /\s(\d{10})\s[+-]\d{4}\s/; // We only need \d{10} here, wrapped with other stuff to make sure we get the correct content
  const commitTimeMatches = line.match(commitTimeReg);
  return commitTimeMatches ? Number(commitTimeMatches[1]) * 1000 : null;
};

const getPackageName = (line) => {
  const packageNameReg = /\)\s+"(.+)":\s"/; // We only need (.+) here, wrapped with other stuff to make sure we get the correct content
  const packageNameMatches = line.match(packageNameReg);
  return packageNameMatches ? packageNameMatches[1] : null;
};

const getStaticPackages = (lines) => {
  let reachDependenciesStart = false;
  const staticPackages = {};

  const filterByYear = (commitTime, line, maxYear) => {
    for (let i = maxYear; i > 0; i--) {
      const packageName = getPackageName(line);
      if (!packageName || packageName.startsWith('@types/')) break;

      const comparedYearTime = new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * i;
      const timeRange = `${i} year${i === 1 ? '' : 's'}`;
      if(commitTime < comparedYearTime) {
        if (!staticPackages[timeRange]) staticPackages[timeRange] = [];
        if (packageName) staticPackages[timeRange].push(packageName);
        break;
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    // find the beginning of dependencies block
    const line = lines[i];
    if (line.endsWith('"dependencies": {')) {
      reachDependenciesStart = true;
    }
    if (!reachDependenciesStart) continue;

    // dependencies block ends
    if (reachDependenciesStart && line.endsWith('},')) {
      break;
    }

    // handle content in the dependencies block
    const commitTime = getCommitTime(line);
    const maxYear = 5;
    if (commitTime) {
      filterByYear(commitTime, line, maxYear);
    }
  }

  return staticPackages;
};

const start = (filePath) => {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  const tempFilePath = path.resolve(__dirname, '../git-blame.tmp');
  console.log('resolvedPath', resolvedPath);

  // Generate git-blame.txt by this script.
  exec(`git blame -t ${resolvedPath} >${tempFilePath} 2>&1`)

  const gitBlameContent = fs.readFileSync(tempFilePath, 'utf-8');
  const lines = gitBlameContent.split('\n');
  const staticPackages = getStaticPackages(lines);

  let suggestion = '';
  Object.keys(staticPackages).sort().forEach((timeRange, index) => {
    const packageNames = staticPackages[timeRange];
    if (packageNames.length > 0) {
      suggestion += (index === 0 ? '' : `${Array.from({ length: 72 }, () => '-').join('')}\n`) +
                  `The following module(s) have not been upgraded their versions for ${timeRange}:\n` +
                  packageNames.map((name) => `- ${name}`).join('\n') + '\n';
    }
  });
  console.log(suggestion);
};

module.exports = start;
