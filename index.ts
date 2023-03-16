import * as prompts from "@clack/prompts";
import { exec } from "node:child_process";
import { stat } from "node:fs/promises";
import { cwd } from "node:process";
import { red, green, bold } from "picocolors";
import { version } from "./package.json";

async function isGitRepo(path = cwd()) {
  try {
    await stat(`${path}/.git`);
    return true;
  } catch {
    return false;
  }
}

function sleep(delay: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

function check(result: unknown) {
  if (prompts.isCancel(result)) {
    exit("Operation Cancelled.");
  }
}

function exit(message: string | undefined = "") {
  if (message) {
    prompts.outro(message);
  }

  process.exit(0);
}

async function main() {
  console.clear();

  prompts.intro(`@bushuai/brc - v${version}`);
  const spinner = prompts.spinner();
  spinner.start("Checking workspace");

  if (!(await isGitRepo())) {
    exit(`To run ${bold("brc")} in a git repository`);
  }

  exec("git status --porcelain", async (error: any, stdout: string) => {
    if (error) {
      exit(error);
    }

    await sleep(500);

    if (stdout.trim()) {
      spinner.stop("Unstaged changes found.");
      const confirmed = await prompts.confirm({
        active: "Yes",
        inactive: "No",
        message: "Do you want to stash them?",
      });

      check(confirmed);

      if (confirmed) {
        const message = await prompts.text({
          message: "Enter the stash message:",
          defaultValue: `stashed at ${Date.now()}`,
        });

        check(message);

        exec(`git stash save ${message as string}`, () => {
          prompts.log.info(green("Changes stashed."));
          switchBranch();
        });
      } else {
        exit(
          red("Please commit or stash your changes before switching branches."),
        );
      }
    } else {
      spinner.stop("No Changes.");
      switchBranch();
    }
  });

  function switchBranch() {
    exec(
      "git branch --sort=-committerdate | head -10",
      async (error: any, stdout: string) => {
        if (error) {
          exit(error);
        }

        if (!stdout) {
          exit("No branch");
        }

        const branches: string[] = stdout.split("\n") || [];

        const options = branches
          ?.filter((branch) => branch !== "")
          .map((branch) => {
            let val = branch.replace("*", "").trim();
            return {
              label: val,
              value: val,
            };
          });

        const branch = await prompts.select({
          message: "Select a branch:",
          options,
        });

        check(branch);

        exec(`git checkout ${branch}`, () => {
          prompts.outro(green(`✨ Switched to branch ${branch}.`));
        });
      },
    );
  }
}

main().catch(console.error);
