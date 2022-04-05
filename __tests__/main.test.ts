import {formatInputs} from '../src/main'
import mockDeploy from './mocks/pull_request_created'

describe('formatInputs', () => {
  it('returns exact repo', () => {
    const results = formatInputs(
      mockDeploy,
      jest.fn(() => {
        return 'foo'
      }),
      jest.fn(() => {
        return false
      })
    )
    expect(results.ref).toEqual('dependabot/npm_and_yarn/url-parse-1.5.10')
  })

  it('returns removes invalid name characters', () => {
    const results = formatInputs(
      mockDeploy,
      jest.fn(() => {
        return 'foo'
      }),
      jest.fn(() => {
        return false
      })
    )
    expect(results.branch).toEqual('dependabot-npm-and-yarn-url-parse-1-5-10')
  })
})
