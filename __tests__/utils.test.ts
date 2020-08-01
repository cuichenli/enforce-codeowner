import fs from 'fs'
import { mocked } from 'ts-jest/utils'
import { generateGlobber, checkFiles, readRequiredContext } from '../src/utils'
import * as glob from '@actions/glob'
import * as github from '@actions/github'

jest.mock('fs')
jest.mock('glob')
describe('index', () => {
  describe('generateGlobber', () => {
    let mockedRead: jest.MockedFunction<typeof fs.readFileSync>
    let createSpy: jest.SpyInstance
    let mockedExist: jest.MockedFunction<typeof fs.existsSync>
    beforeEach(() => {
      mockedRead = mocked(fs.readFileSync) as jest.MockedFunction<
        typeof fs.readFileSync
      >
      createSpy = jest.spyOn(glob, 'create')
      mockedExist = mocked(fs.existsSync)
    })

    afterEach(() => {
      mockedRead.mockClear()
      createSpy.mockClear()
      mockedExist.mockClear()
    })

    it('Should generate globber based on contents in CODEOWNER file with one codeonwer and comments', () => {
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
    `)
      mockedExist.mockReturnValue(true)
      return generateGlobber('CODEOWNER').then(() => {
        expect(mockedRead.mock.calls.length).toBe(1)
        expect(mockedRead.mock.calls[0][0]).toBe('CODEOWNER')
        expect(createSpy.mock.calls.length).toBe(1)
        expect(createSpy.mock.calls[0][0]).toBe('*.js')
        expect(mockedExist).toHaveBeenCalledTimes(1)
        expect(mockedExist).toHaveBeenCalledWith('CODEOWNER')
      })
    })

    it('Should generate globber based on contents in CODEOWNER file with multipe codeonwers and comments', async () => {
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
        *.ts     @someoneelse
    `)
      mockedExist.mockReturnValue(true)

      return generateGlobber('CODEOWNER').then(() => {
        expect(mockedRead.mock.calls.length).toBe(1)
        expect(mockedRead.mock.calls[0][0]).toBe('CODEOWNER')
        expect(createSpy.mock.calls.length).toBe(1)
        expect(createSpy.mock.calls[0][0]).toBe(['*.js', '*.ts'].join('\n'))
        expect(mockedExist).toHaveBeenCalledTimes(1)
        expect(mockedExist).toHaveBeenCalledWith('CODEOWNER')
      })
    })

    it('Should read the default codeowner file when no codeowner file is provided', () => {
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
        *.ts     @someoneelse
    `)
      mockedExist.mockReturnValue(true)
      return generateGlobber(undefined).then(() => {
        expect(mockedRead.mock.calls.length).toBe(1)
        expect(mockedRead.mock.calls[0][0]).toBe('.github/CODEOWNERS')
        expect(createSpy.mock.calls.length).toBe(1)
        expect(createSpy.mock.calls[0][0]).toBe(['*.js', '*.ts'].join('\n'))
        expect(mockedExist).toHaveBeenCalledTimes(1)
        expect(mockedExist).toHaveBeenCalledWith('.github/CODEOWNERS')
      })
    })
    it('Should throw error when provided codeowner file does not exist', () => {
      mockedExist.mockReturnValue(false)
      return generateGlobber(undefined).catch((error: Error) => {
        expect(mockedExist).toHaveBeenCalledTimes(1)
        expect(mockedExist).toHaveBeenCalledWith('.github/CODEOWNERS')
        expect(error.message).toEqual(
          'CODEOWNERS file .github/CODEOWNERS not exist.'
        )
      })
    })
  })

  describe('checkFiles', () => {
    it('Should pass when all the files are covered', () => {
      return glob.create('').then((globber) => {
        const mockedGlob = jest.spyOn(globber, 'glob')
        mockedGlob.mockResolvedValue(['file1', './file2'])
        return checkFiles(globber, ['file1', './file2']).then((result) => {
          expect(result).toBe(true)
        })
      })
    })

    it('Should fail when not all the files are covered', () => {
      return glob.create('').then((globber) => {
        const mockedGlob = jest.spyOn(globber, 'glob')
        mockedGlob.mockResolvedValue(['file1', 'file23'])
        return checkFiles(globber, ['file1', 'file2']).then((result) => {
          expect(result).toBe(false)
        })
      })
    })
  })

  describe('readRequiredContext', () => {
    const OLD_ENV = process.env
    const originalContext = { ...github.context }
    beforeEach(() => {
      jest.resetModules()
      process.env = {}
    })

    afterEach(() => {
      process.env = OLD_ENV
      github.context.payload.number = originalContext.payload.number
      jest.clearAllMocks()
    })

    it('Should not throw any error when the required environment variables are provided', () => {
      process.env = {
        GITHUB_TOKEN: 'token',
      }
      github.context.payload.number = 23
      const [token, prNumber] = readRequiredContext()
      expect(token).toBe('token')
      expect(prNumber).toBe(23)
    })

    it('Should throw error when GITHUB_TOKEN is not provided', () => {
      process.env = {}
      expect(readRequiredContext).toThrow('Failed to read GITHUB_TOKEN')
    })
  })
})
