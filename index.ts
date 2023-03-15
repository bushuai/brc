import * as prompts from '@clack/prompts';
import { exec } from 'node:child_process'
import { red, green } from 'picocolors';
import { version } from './package.json'

function sleep(delay: number) {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}

function check(result: unknown) {
  if (prompts.isCancel(result)) {
    prompts.outro('Operation Cancelled.')
    process.exit(0)
  }
}

async function main() {
  console.clear();

  prompts.intro(`@bushuai/brch - v${version}`)
  const spinner = prompts.spinner();
  spinner.start('Checking workspace')

  exec('git status --porcelain', async (error: any, stdout: string) => {
    if (error) {
      console.error(error);
      return;
    }

    await sleep(500);
    if (stdout.trim()) {
      spinner.stop('Workspace has changed.');
      const confirmed = await prompts.confirm({
        active: 'Yes',
        inactive: 'No',
        message: 'There are unstaged changes. Do you want to stash them?',
      })

      check(confirmed)

      if (confirmed) {
        const message = await prompts.text({
          message: 'Enter the stash message:',
          defaultValue: `stashed at ${Date.now()}`
        })

        check(message)

        exec(`git stash save ${message as string}`, () => {
          console.log(green('Changes stashed.'));
          switchBranch();
        });
      } else {
        console.log(red('Please commit or stash your changes before switching branches.'));
        process.exit(0)
      }
    } else {
      spinner.stop('Workspace is clear.');
      switchBranch();
    }
  });


  function switchBranch() {
    exec('git branch --list', async (error: any, stdout: string) => {
      if (error) {
        console.error(error);
        return;
      }

      if (!stdout) {
        console.error('No branch')
        return;
      }

      const branches: string[] = stdout.split('\n') || []

      const options = branches?.filter((branch) => branch !== '').map((branch) => {
        let val = branch.replace('*', '').trim()
        return {
          label: val,
          value: val
        }
      });

      const branch = await prompts.select({
        message: 'Select a branch:',
        options,
      })

      check(branch)

      exec(`git checkout ${branch}`, () => {
        prompts.outro(green(`✨ Switched to branch ${branch}.`));
      });
    });
  }
}

main().catch(console.error)
