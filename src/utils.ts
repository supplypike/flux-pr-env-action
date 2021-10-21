import * as core from '@actions/core'

export function getInputRequired(key: string): string {
  const v = core.getInput(key)
  if (!v) {
    throw new Error(`Missing required input ${key}`)
  }
  return v
}
