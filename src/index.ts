import core from "@actions/core";
import glob from "@actions/glob";
import github from "@actions/github/lib/github";
import process from "process";
import fs from "fs";
import { OctokitResponse, PullsListFilesResponseData } from "@octokit/types";

async function generateGlobber(
  codeOwnerPath: string | undefined
): Promise<glob.Globber> {
  const rawCodeOwners = fs.readFileSync(codeOwnerPath || ".github/CODEOWNERS");

  const globPatterns = rawCodeOwners
    .toString()
    .split(/\r?\n/)
    .reduce((acc: string[], curr) => {
      const trimmedLine = curr.trim();
      if (trimmedLine === "") {
        return acc;
      }
      const globPattern = trimmedLine.split(/\s+/)[0];
      acc.push(globPattern);
      return acc;
    }, []);
  const globber = await glob.create(globPatterns.join("\n"));
  return globber;
}

function readRequiredContext(): [string, string] {
  const token = process.env.GITHUB_TOKEN;
  if (token === undefined) {
    throw "Failed to read GITHUB_TOKEN";
  }

  const githubRef = process.env.GITHUB_REF; // refs/pull/:prNumber/merge
  if (githubRef === undefined) {
    throw "Failed to read GITHUB_REF";
  }

  const prNumber = githubRef.split("/")[2];
  return [token, prNumber];
}

async function main() {
  const [token, prNumber] = readRequiredContext();
  const codeOwnerPath = core.getInput("CODEOWNERS_PATH", { required: false });

  const { owner, repo } = github.context.repo;
  const octokit = github.getOctokit(token);
  const response: OctokitResponse<PullsListFilesResponseData> = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    {
      pull_number: Number(prNumber),
      owner,
      repo,
    }
  );
  const glober = await generateGlobber(codeOwnerPath);
  const result = await checkFiles(glober, response.data);
  if (!result) {
    throw "Test failed.";
  }
}

async function checkFiles(
  globber: glob.Globber,
  diffFiles: PullsListFilesResponseData
): Promise<boolean> {
  const files = await globber.glob();
  let passed = true;
  diffFiles.map((file) => {
    if (!(file.filename in files)) {
      core.error(`${file.filename} does not have a codeowner.`);
      passed = false;
    }
  });
  return passed;
}

main().catch((error: Error) => {
  core.error(error.message);
  process.exit(1);
});
