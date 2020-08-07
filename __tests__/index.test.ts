import { mocked } from 'ts-jest/utils'
import * as utils from '../src/utils'
import * as github from '@actions/github'
import nock from 'nock'
import * as index from '../src/index'
import { Ignore } from 'ignore'

jest.mock('../src/utils', () => {
  const originModule = jest.requireActual('../src/utils')
  return {
    __esModule: true,
    checkFiles: originModule.checkFiles,
    readRequiredContext: jest.fn(),
    generateIgnore: jest.fn(),
    postComment: jest.fn(),
  }
})
describe('main', () => {
  let mockedReadContext: jest.MockedFunction<typeof utils.readRequiredContext>
  let mockedGenerateIgnore: jest.MockedFunction<typeof utils.generateIgnore>
  let mockedPostComment: jest.MockedFunction<typeof utils.postComment>
  let spyCheckFile: jest.SpiedFunction<typeof utils.checkFiles>
  beforeEach(() => {
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'some-owner',
        repo: 'some-repo',
      }
    })
    mockedReadContext = mocked(utils.readRequiredContext, true)
    mockedReadContext.mockReturnValue(['token', 40])
    mockedPostComment = mocked(utils.postComment, true)
    mockedGenerateIgnore = mocked(utils.generateIgnore)
    mockedGenerateIgnore.mockImplementationOnce((ig: Ignore) => {
      ig.add('*.ts').add('*.json')
    })
    spyCheckFile = jest.spyOn(utils, 'checkFiles')
  })
  afterEach(() => {
    mockedReadContext.mockClear()
    mockedGenerateIgnore.mockClear()
    spyCheckFile.mockClear()
    mockedPostComment.mockClear()
  })
  it('Should pass when all the files are covered', () => {
    const scope = nock('https://api.github.com')
      .get('/repos/some-owner/some-repo/pulls/40/files')
      .reply(200, [
        {
          sha: 'b9f5fc605399b291e9f6f0b5c1cf7cc0cfc45988',
          filename: 'package.json',
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
          filename: 'src/index.ts',
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
    return index.main().then(() => {
      scope.done()
      expect(mockedReadContext.mock.calls.length).toBe(1)
      expect(spyCheckFile).toHaveBeenCalledTimes(1)
      expect(spyCheckFile.mock.calls[0][1]).toEqual([
        'package.json',
        'src/index.ts',
      ])
      expect(mockedPostComment).toHaveBeenCalledTimes(0)
    })
  })
  it('Should not pass when not all the files are covered', () => {
    const scope = nock('https://api.github.com')
      .get('/repos/some-owner/some-repo/pulls/40/files')
      .reply(200, [
        {
          sha: 'b9f5fc605399b291e9f6f0b5c1cf7cc0cfc45988',
          filename: 'package.json',
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
          filename: 'src/not-exist.js',
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
    return index.main().catch((e: Error) => {
      scope.done()
      expect(mockedReadContext.mock.calls.length).toBe(1)
      expect(spyCheckFile).toHaveBeenCalledTimes(1)
      expect(spyCheckFile.mock.calls[0][1]).toEqual([
        'package.json',
        'src/not-exist.js',
      ])
      expect(mockedPostComment).toHaveBeenCalledTimes(1)
      expect(mockedPostComment.mock.calls[0][0]).toEqual(['src/not-exist.js'])
      expect(mockedPostComment.mock.calls[0][1]).toEqual('some-owner')
      expect(mockedPostComment.mock.calls[0][2]).toEqual('some-repo')
      expect(mockedPostComment.mock.calls[0][3]).toEqual(40)
      expect(e.message).toBe('Test failed.')
    })
  })
})
