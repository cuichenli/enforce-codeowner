import fs from 'fs'
import { mocked } from 'ts-jest/utils'
import { generateGlobber, checkFiles } from '../src/utils'
import * as glob from '@actions/glob'

jest.mock('fs')
jest.mock('glob')
describe('index', () => {
  describe('generateGlobber', () => {
    let mockedRead: jest.MockedFunction<typeof fs.readFileSync>
    let createSpy: jest.SpyInstance
    beforeEach(() => {
      mockedRead = mocked(fs.readFileSync) as jest.MockedFunction<
        typeof fs.readFileSync
      >
      createSpy = jest.spyOn(glob, 'create')
    })

    afterEach(() => {
      mockedRead.mockClear()
      createSpy.mockClear()
    })

    it('Should generate globber based on contents in CODEOWNER file with one codeonwer and comments', () => {
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
    `)
      return generateGlobber('CODEOWNER').then(() => {
        expect(mockedRead.mock.calls.length).toBe(1)
        expect(mockedRead.mock.calls[0][0]).toBe('CODEOWNER')
        expect(createSpy.mock.calls.length).toBe(1)
        expect(createSpy.mock.calls[0][0]).toBe('*.js')
      })
    })

    it('Should generate globber based on contents in CODEOWNER file with multipe codeonwers and comments', () => {
      const mockedRead = mocked(fs.readFileSync)
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
        *.ts     @someoneelse
    `)
      return generateGlobber('CODEOWNER').then(() => {
        expect(mockedRead.mock.calls.length).toBe(1)
        expect(mockedRead.mock.calls[0][0]).toBe('CODEOWNER')
        expect(createSpy.mock.calls.length).toBe(1)
        expect(createSpy.mock.calls[0][0]).toBe(['*.js', '*.ts'].join('\n'))
      })
    })

    it('Should read the default codeowner file when no codeowner file is provided', () => {
      const mockedRead = mocked(fs.readFileSync)
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
        *.ts     @someoneelse
    `)
      return generateGlobber(undefined).then(() => {
        expect(mockedRead.mock.calls.length).toBe(1)
        expect(mockedRead.mock.calls[0][0]).toBe('.github/CODEOWNERS')
        expect(createSpy.mock.calls.length).toBe(1)
        expect(createSpy.mock.calls[0][0]).toBe(['*.js', '*.ts'].join('\n'))
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
})
