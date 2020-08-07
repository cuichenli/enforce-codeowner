import nock from 'nock'
import { main } from '../src/index'
import * as github from '@actions/github'
describe = process.env.INTEGRATION_TEST === 'true' ? describe : describe.skip

describe('integration-test', () => {
  let scope: nock.Scope
  beforeEach(() => {
    scope = nock('https://api.github.com')
  })

  afterEach(() => {
    scope.done()
  })
  it('Should run without error when the provided files are covered by CODEOWNER', async () => {
    scope
      .get(
        `/repos/${process.env.GITHUB_REPOSITORY}/pulls/${github.context.payload.number}/files`
      )
      .reply(200, [
        {
          sha: 'b9f5fc605399b291e9f6f0b5c1cf7cc0cfc45988',
          filename: '__tests__/integration-test.test.ts',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          blob_url: '',
          raw_url: '',
          contents_url: '',
          patch: '',
        },
        {
          sha: 'b9f5fc605399b291e9f6f0b5c1cf7cc0cfc45988',
          filename: '__tests__/data/pull_request.json',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          blob_url: '',
          raw_url: '',
          contents_url: '',
          patch: '',
        },
      ])
    await main()
  })

  it('Should throw error when the provided files are not covered by CODEOWNER', async () => {
    scope
      .get(
        `/repos/${process.env.GITHUB_REPOSITORY}/pulls/${github.context.payload.number}/files`
      )
      .reply(200, [
        {
          sha: 'b9f5fc605399b291e9f6f0b5c1cf7cc0cfc45988',
          filename: '__tests__/integration-test.test.js',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          blob_url: '',
          raw_url: '',
          contents_url: '',
          patch: '',
        },
        {
          sha: 'b9f5fc605399b291e9f6f0b5c1cf7cc0cfc45988',
          filename: '__tests__/data/pull_request.json',
          status: 'modified',
          additions: 1,
          deletions: 1,
          changes: 2,
          blob_url: '',
          raw_url: '',
          contents_url: '',
          patch: '',
        },
      ])
      .post(
        `/repos/${process.env.GITHUB_REPOSITORY}/issues/${github.context.payload.number}/comments`,
        {
          body:
            'The following files do not have CODEOWNER\n- __tests__/integration-test.test.js',
        }
      )
      .reply(200)
    expect.assertions(1)
    try {
      await main()
    } catch (error) {
      expect(error.message).toBe('Test failed.')
    }
  })
})
