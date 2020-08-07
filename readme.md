# Enforce Codeowner

This action is to enforce codeowner for PR.

## Inputs

### CODEOWNERS_PATH

The path to the CODEOWNERS file in this repository.
The default value is `.github/CODEOWNERS`

### POST_COMMENT

Specify the value to be `true` if you want the github action to automatically post a comment to the associated PR when the changed files do not have code owner.
The default value is `true`.

### Environment Variable

The only `env` variable required is the token for the action to run: GitHub generates one automatically, but you need to pass it through `env` to make it available to actions. You can find more about `GITHUB_TOKEN` [here](https://help.github.com/en/articles/virtual-environments-for-github-actions#github_token-secret).

## Example usage

```yaml
uses: cuichenli/enforce-codeowner@
with:
  CODEWONERS_PATH: '.github/CODEOWNERS'
  POST_COMMENT: true
env:
  GITHUB_TOKEN: '{{ secrets.GITHUB_TOKEN }}'
```
