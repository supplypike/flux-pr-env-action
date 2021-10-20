import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {fluxDeploy} from './deploy'

import {slugPrContext, slugurlref} from './slug'
import {getInputRequired} from './utils'

const INPUT_KUSTOMIZE_PATH = 'kustomizePath'
const INPUT_REPO_SECRET = 'repoSecret'
const INPUT_DEPLOY_IMAGE = 'deployImage'
const INPUT_NAMESPACE = 'namespace'

async function run(): Promise<void> {
  try {
    if (github.context.eventName !== 'pull_request') {
      return
    }
    const payload = github.context.payload as PullRequestEvent
    const kPath = getInputRequired(INPUT_KUSTOMIZE_PATH)
    const gitSecret = getInputRequired(INPUT_REPO_SECRET)
    const namespace = getInputRequired(INPUT_NAMESPACE)
    const {branch, sshUrl, action, repoName} = slugPrContext(payload)
    const name = slugurlref(`${repoName}-${branch}`)

    const deploy = fluxDeploy({
      name,
      namespace,
      kustomization: {
        path: kPath
      },
      gitRepo: {
        branch,
        secretName: gitSecret,
        url: sshUrl
      }
    })

    if (action === 'opened' || action === 'reopened') {
      await deploy.deploy()
    }

    if (action === 'closed') {
      await deploy.destroy()
    } else {
      const deployImage = getInputRequired(INPUT_DEPLOY_IMAGE)
      await deploy.rollout(deployImage)
    }
  } catch (error) {
    if (error instanceof HttpError) {
      core.info(`HttpError ${error.statusCode}: ${JSON.stringify(error.body)}`)
    }
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
