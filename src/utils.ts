import fs from 'fs'
import * as glob from '@actions/glob'
import * as core from '@actions/core'
import path from 'path'

export async function generateGlobber(
  codeOwnerPath: string | undefined
): Promise<glob.Globber> {
  const rawCodeOwners = fs.readFileSync(codeOwnerPath || '.github/CODEOWNERS')

  const globPatterns = rawCodeOwners
    .toString()
    .split(/\r?\n/)
    .reduce((acc: string[], curr) => {
      const trimmedLine = curr.trim()
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        return acc
      }
      const globPattern = trimmedLine.split(/\s+/)[0]
      acc.push(globPattern)
      return acc
    }, [])
  return await glob.create(globPatterns.join('\n'))
}

export async function checkFiles(
  globber: glob.Globber,
  diffFiles: string[]
): Promise<boolean> {
  const files = await globber.glob()
  const resolvedPaths = files.map((file) => path.resolve(file))
  let passed = true
  diffFiles.map((file) => {
    if (resolvedPaths.indexOf(path.resolve(file)) === -1) {
      core.error(`${file} does not have a codeowner.`)
      passed = false
    }
  })
  return passed
}
