import fs from "fs";
import * as glob from "@actions/glob";

export async function generateGlobber(
  codeOwnerPath: string | undefined
): Promise<glob.Globber> {
  const rawCodeOwners = fs.readFileSync(codeOwnerPath || ".github/CODEOWNERS");

  const globPatterns = rawCodeOwners
    .toString()
    .split(/\r?\n/)
    .reduce((acc: string[], curr) => {
      const trimmedLine = curr.trim();
      if (trimmedLine === "" || trimmedLine.startsWith("#")) {
        return acc;
      }
      const globPattern = trimmedLine.split(/\s+/)[0];
      acc.push(globPattern);
      return acc;
    }, []);
  return await glob.create(globPatterns.join("\n"));
}
