// #!/usr/bin/env node
import chalk from 'chalk';
import pkg from '../../package.json';

export const runBuild = async () => {
  try {
    console.log(`✨ ${chalk.cyan(`[${pkg.name}]`)}` + ' - 编译成功!');
  } catch (error) {
    console.log(chalk.red('编译出错:\n' + error));
    process.exit(1);
  }
};
runBuild();
