import {formatInputs, getConfig} from '../src/main'
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
      jest.fn(() => {
        return 'foo'
      }),
      jest.fn(() => {
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
      key => mockUnformattedInputs[key],
      () => false
    )

    expect(actual).toEqual(mockFormattedInputs)
  })
})

describe('#getConfig', () => {
  it('returns a config object', () => {
    const actual = getConfig(mockFormattedInputs)
    expect(actual).toEqual(mockDeploy)
  })
})
