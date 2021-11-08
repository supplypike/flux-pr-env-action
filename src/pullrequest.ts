import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {Deploy} from './deploy'

export async function handlePullRequest(
  payload: PullRequestEvent,
  deploy: Deploy
): Promise<void> {
  let hasLabel =
    payload.pull_request.labels.findIndex(l => l.name === 'preview') > -1
  if (payload.action === 'labeled' || payload.action === 'unlabeled') {
    hasLabel = payload.label.name === 'preview'
  }

  if (!hasLabel) {
    return
  }

  if (
    payload.action === 'labeled' ||
    payload.action === 'synchronize' ||
    payload.action === 'opened' ||
    payload.action === 'reopened'
  ) {
    return await deploy.deployOrRollout()
  }

  if (payload.action === 'unlabeled' || payload.action === 'closed') {
    return await deploy.destroy()
  }
}
