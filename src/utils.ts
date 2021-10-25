import * as core from '@actions/core'

export function getInputRequired(key: string, defaultValue?: string): string {
  // getInput returns empty string if the value does not exist
  const v = core.getInput(key)
  if (v !== '') {
    return v
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }
  throw new Error(`Missing required input ${key}`)
}
