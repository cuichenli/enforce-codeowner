import * as core from "@actions/core";
import * as glob from "@actions/glob";
import * as github from "@actions/github/lib/github";
import { generateGlobber } from "./utils";
import process from "process";
import { OctokitResponse, PullsListFilesResponseData } from "@octokit/types";

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
