import * as core from '@actions/core'
import * as github from '@actions/github/lib/github'
import { generateGlobber, checkFiles, readRequiredContext } from './utils'
import process from 'process'
import { OctokitResponse, PullsListFilesResponseData } from '@octokit/types'

async function main() {
  const [token, prNumber] = readRequiredContext()
  const codeOwnerPath = core.getInput('CODEOWNERS_PATH', { required: false })

  const { owner, repo } = github.context.repo
  const octokit = github.getOctokit(token)
  const response: OctokitResponse<PullsListFilesResponseData> = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
    {
      pull_number: Number(prNumber),
      owner,
      repo,
    }
  )
  const glober = await generateGlobber(codeOwnerPath)
  const result = await checkFiles(
    glober,
    response.data.map((data) => data.filename)
  )
  if (!result) {
    throw 'Test failed.'
  }
}

if (require.main === module) {
  main().catch((error: Error) => {
    core.error(error.message)
    process.exit(1)
  })
}
