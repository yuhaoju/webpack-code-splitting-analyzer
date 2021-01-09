const { Command } = require('commander');

const checkStats = require('./checkStats.js');
const checkStatic = require('./checkStatic.js');

const program = new Command();
program.version('0.0.1')
  .command('packages <filePath>')
  .action((filePath) => {
    checkStatic(filePath)
  });;

program.version('0.0.1')
  .command('stats <filePath>')
  .action((filePath) => {
    checkStats(filePath)
  });;

program.parse(process.argv);
