import { describe, expect, it, vi } from 'vitest'
import { formatInputs, getConfig, previewBranch } from '../src/config'
import {
  mockDeploy,
  mockFormattedInputs,
  mockUnformattedInputs
} from './mocks/mocks'
import mockPayload from './mocks/pull_request_created'

describe('#formatInputs', () => {
  it('returns removes invalid name characters', () => {
    const results = formatInputs(
      mockPayload,
      vi.fn(() => {
        return 'foo'
      }),
      vi.fn(() => {
        return false
      })
    )
    expect(results.branchKubeNameClean).toEqual(
      'dependabot-npm-and-yarn-url-parse-1-5-10'
    )
  })

  it('formats inputs', () => {
    const actual = formatInputs(
      mockPayload,
      (key) => mockUnformattedInputs[key],
      () => false
    )

    expect(actual).toEqual(mockFormattedInputs)
  })
})

describe('#previewBranch', () => {
  const longRef =
    'SRENEW-1069-update-readiness-when-archive-changes-and-more-words'

  it('leaves short branches unchanged', () => {
    expect(previewBranch('dnx-web', 'DNX-1183-update-dependencies')).toEqual(
      'dnx-1183-update-dependencies'
    )
  })

  it('keeps serviceName-branch within 53 characters', () => {
    const branch = previewBranch('dnx-web', longRef)
    expect(`dnx-web-${branch}`.length).toBeLessThanOrEqual(53)
    expect(branch).toMatch(
      /^srenew-1069-update-readiness-when-arch-[0-9a-f]{6}$/
    )
  })

  it('gives different names to long branches with the same prefix', () => {
    const a = previewBranch('dnx-web', `${longRef}-a`)
    const b = previewBranch('dnx-web', `${longRef}-b`)
    expect(a).not.toEqual(b)
  })

  it('returns the same name for the same branch', () => {
    expect(previewBranch('dnx-web', longRef)).toEqual(
      previewBranch('dnx-web', longRef)
    )
  })

  it('does not leave a double hyphen before the hash', () => {
    const branch = previewBranch(
      'dnx-web',
      `${'a'.repeat(37)}-${'b'.repeat(20)}`
    )
    expect(branch).not.toContain('--')
  })

  it('throws when serviceName leaves no room for a branch', () => {
    expect(() => previewBranch('a'.repeat(50), longRef)).toThrow(/too long/)
  })
})

describe('#formatInputs with a long branch', () => {
  it('uses the shortened branch in both name and branch', () => {
    const payload = structuredClone(mockPayload)
    payload.pull_request.head.ref =
      'SRENEW-1069-update-readiness-when-archive-changes-and-more-words'
    const actual = formatInputs(
      payload,
      (key) => (key === 'serviceName' ? 'dnx-web' : 'foo'),
      () => false
    )

    expect(actual.name).toEqual(`dnx-web-${actual.branchKubeNameClean}`)
    expect(actual.name.length).toBeLessThanOrEqual(53)
  })
})

describe('#getConfig', () => {
  it('returns a config object', () => {
    const actual = getConfig(mockFormattedInputs)
    expect(actual).toEqual(mockDeploy)
  })
})
