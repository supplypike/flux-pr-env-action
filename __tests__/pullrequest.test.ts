import {describe, expect, it, jest, beforeEach} from '@jest/globals'
import {
  PullRequestEvent,
  PullRequestLabeledEvent
} from '@octokit/webhooks-types'
import {Deploy} from '../src/deploy'
import {handlePullRequest} from '../src/pullrequest'
import {mockLabel, mockPreviewLabel} from './mocks/mocks'
import pull_request_created from './mocks/pull_request_created'

jest.mock('@actions/core')

let mockDeploy: Deploy
let destroy = jest.fn(() => Promise.resolve())
let deployOrRollout = jest.fn(() => Promise.resolve())
let payload: PullRequestEvent

beforeEach(() => {
  destroy = jest.fn(() => Promise.resolve())
  deployOrRollout = jest.fn(() => Promise.resolve())
  mockDeploy = {
    destroy,
    deployOrRollout: deployOrRollout
  }
  payload = JSON.parse(JSON.stringify(pull_request_created))
})

describe('event = closed | not labeled', () => {
  it('should be no-op', async () => {
    payload.action = 'closed'
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = closed | labeled', () => {
  it('should call destroy()', async () => {
    payload.action = 'closed'
    payload.pull_request.labels = [mockPreviewLabel]
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = opened | not labeled', () => {
  it('should be no-op', async () => {
    payload.action = 'opened'
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = opened | labeled', () => {
  it('should call deployOrRollout()', async () => {
    payload.action = 'opened'
    payload.pull_request.labels = [mockPreviewLabel]
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).toHaveBeenCalled()
  })
})

describe('event = reopened | not labeled', () => {
  it('should be no-op', async () => {
    payload.action = 'reopened'
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = reopened | labeled', () => {
  it('should call deployOrRollout()', async () => {
    payload.action = 'reopened'
    payload.pull_request.labels = [mockPreviewLabel]
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).toHaveBeenCalled()
  })
})

describe('event = synchronize | unlabeled', () => {
  it('should be no-op', async () => {
    payload.action = 'synchronize'
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = syncronized | labeled', () => {
  it('should call deployOrRollout()', async () => {
    payload.action = 'synchronize'
    payload.pull_request.labels = [mockPreviewLabel]
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).toHaveBeenCalled()
  })
})

describe('event = labeled | different label', () => {
  it('should be no-op', async () => {
    payload.action = 'labeled'
    ;(payload as PullRequestLabeledEvent).label = mockLabel
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = labeled | preview label', () => {
  it('should call deployOrRollout()', async () => {
    payload.action = 'labeled'
    ;(payload as PullRequestLabeledEvent).label = mockPreviewLabel
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).toHaveBeenCalled()
  })
})

describe('event = unlabeled | different label', () => {
  it('should be no-op', async () => {
    payload.action = 'unlabeled'
    ;(payload as PullRequestLabeledEvent).label = mockLabel
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).not.toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})

describe('event = labeled | preview label', () => {
  it('should call destroy()', async () => {
    payload.action = 'unlabeled'
    ;(payload as PullRequestLabeledEvent).label = mockPreviewLabel
    await handlePullRequest(payload, mockDeploy)
    expect(destroy).toHaveBeenCalled()
    expect(deployOrRollout).not.toHaveBeenCalled()
  })
})
