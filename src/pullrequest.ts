import {PullRequestEvent} from '@octokit/webhooks-types'

export async function handlePullRequest(
  payload: PullRequestEvent,
  deployHandler: () => Promise<void>,
  destroyHandler: () => Promise<void>
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
    await deployHandler()
  }

  if (payload.action === 'unlabeled' || payload.action === 'closed') {
    return await destroyHandler()
  }
}
