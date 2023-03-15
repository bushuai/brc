import { execSync } from 'node:child_process';
import { prompt } from '@clack/prompts';

const getBranches = () => {
  // 获取最近 10 个分支
  const branches = execSync('git branch --sort=-committerdate | head -n 10').toString().split('\\n');

  // 过滤掉无效的分支
  return branches.filter((branch: string) => {
    return branch && !branch.startsWith('  ');
  }).map((branch: string) => {
    return branch.trim().replace('*', '');
  });
};

const checkUncommittedChanges = async () => {
  // 检测当前工作区是否有未提交的更改
  const uncommittedChanges = execSync('git status --porcelain').toString().trim();

  if (uncommittedChanges) {
    const answer = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: '当前工作区有未提交的更改，是否暂存更改后再切换分支？'
    });

    if (answer.confirm) {
      const stashMessage = await prompt({
        type: 'input',
        name: 'message',
        message: '请输入 stash message：'
      });

      // 暂存更改
      execSync(`git stash save ${stashMessage}`);

      console.log('更改已暂存。');
    } else {
      console.log('请先提交或撤销更改后再进行操作。');
      process.exit(1);
    }
  }
};

(async () => {
  // 检测当前工作区是否有未提交的更改
  await checkUncommittedChanges();

  // 获取分支列表
  const branches = getBranches();

  // 选择分支
  const index = await prompt({
    type: 'select',
    name: 'index',
    message: '请选择要切换的分支：',
    choices: branches.map((branch: string) => {
      return {
        title: branch,
        value: branch
      };
    })
  });

  // 切换分支
  const checkout = execSync(`git checkout ${index}`).toString();

  console.log(`切换到分支 ${index}：`);
  console.log(checkout);
})();
