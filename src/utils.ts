import * as core from '@actions/core'

export function getInputRequired(key: string, defaultValue?: string): string {
  // getInput returns empty string if the value does not exist
  const v: string = core.getInput(key) ?? defaultValue
  if (v !== '') {
    return v
  }
  throw new Error(`Missing required input ${key}`)
}
