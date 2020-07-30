import fs from "fs";
import { mocked } from "ts-jest/utils";
import { generateGlobber } from "../src/utils";
import * as glob from "@actions/glob";

jest.mock("fs");
describe("index", () => {
  describe("generateGlobber", () => {
    let mockedRead: jest.MockedFunction<typeof fs.readFileSync>;
    let createSpy: jest.SpyInstance;
    beforeEach(() => {
      mockedRead = mocked(fs.readFileSync) as jest.MockedFunction<
        typeof fs.readFileSync
      >;
      createSpy = jest.spyOn(glob, "create");
    });

    afterEach(() => {
      mockedRead.mockClear();
      createSpy.mockClear();
    });

    it("Should generate globber based on contents in CODEOWNER file with one codeonwer and comments", () => {
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
    `);
      return generateGlobber("CODEOWNER").then(() => {
        expect(mockedRead.mock.calls.length).toBe(1);
        expect(mockedRead.mock.calls[0][0]).toBe("CODEOWNER");
        expect(createSpy.mock.calls.length).toBe(1);
        expect(createSpy.mock.calls[0][0]).toBe("*.js");
      });
    });

    it("Should generate globber based on contents in CODEOWNER file with multipe codeonwers and comments", () => {
      const mockedRead = mocked(fs.readFileSync);
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
        *.ts     @someoneelse
    `);
      return generateGlobber("CODEOWNER").then(() => {
        expect(mockedRead.mock.calls.length).toBe(1);
        expect(mockedRead.mock.calls[0][0]).toBe("CODEOWNER");
        expect(createSpy.mock.calls.length).toBe(1);
        expect(createSpy.mock.calls[0][0]).toBe(["*.js", "*.ts"].join("\n"));
      });
    });

    it("Should read the default codeowner file when no codeowner file is provided", () => {
      const mockedRead = mocked(fs.readFileSync);
      mockedRead.mockReturnValue(`
        # This is a comment
        *.js     @someone
        *.ts     @someoneelse
    `);
      return generateGlobber(undefined).then(() => {
        expect(mockedRead.mock.calls.length).toBe(1);
        expect(mockedRead.mock.calls[0][0]).toBe(".github/CODEOWNERS");
        expect(createSpy.mock.calls.length).toBe(1);
        expect(createSpy.mock.calls[0][0]).toBe(["*.js", "*.ts"].join("\n"));
      });
    });
  });
});
