import * as prompts from '@clack/prompts';
import { exec } from 'node:child_process'
import { red, green } from 'picocolors';
import { version } from './package.json'

async function main() {
  prompts.intro(`@bushuai/brch - v${version}`)

  exec('git status --porcelain', async (error, stdout) => {
    if (error) {
      console.error(error);
      return;
    }

    if (stdout.trim()) {
      const confirmed = await prompts.confirm({
        active: 'Yes',
        inactive: 'No',
        message: 'There are unstaged changes. Do you want to stash them?',
      })

      if (confirmed) {
        const message = await prompts.text({
          defaultValue: `stashed at ${Date.now()}`,
          placeholder: 'Enter the stash message:',
          message: 'Enter the stash message'
        })
        exec(`git stash save ${message as string}`, () => {
          console.log(green('Changes stashed.'));
          switchBranch();
        });
      } else {
        console.log(red('Please commit or stash your changes before switching branches.'));
        process.exit(0)
      }
    } else {
      switchBranch();
    }
  });

  function switchBranch() {
    exec('git branch --list', async (error, stdout) => {
      if (error) {
        console.error(error);
        return;
      }

      if (!stdout) {
        console.error('No branch')
        return;
      }

      const branches = stdout.match(/\b\w+\b/g) || []
      console.log('[ stdout.match(/\b\w+\b/g)] ', stdout.match(/\b\w+\b/g))
      const options = branches?.filter((branch) => branch !== '').map((branch) => ({
        label: branch.trim(),
        value: branch.trim()
      }));

      console.log("[options]", options);

      const branch = await prompts.multiselect({
        message: 'Select a branch:',
        options,
      })

      console.log('[branch]', branch);

      exec(`git checkout ${branch}`, () => {
        console.log(green(`Switched to branch ${branch}.`));
      });
    });
  }
}

main().catch(console.error)
