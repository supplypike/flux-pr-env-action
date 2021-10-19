import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {fluxDeploy} from './deploy'

import {slugPrContext} from './slug'
import {getInputRequired} from './utils'

const INPUT_KUSTOMIZE_PATH = 'kustomizePath'
const INPUT_REPO_SECRET = 'repoSecret'
const INPUT_DEPLOY_IMAGE = 'deployImage'

async function run(): Promise<void> {
  try {
    if (github.context.eventName !== 'pull_request') {
      return
    }
    const payload = github.context.payload as PullRequestEvent
    const kPath = getInputRequired(INPUT_KUSTOMIZE_PATH)
    const gitSecret = getInputRequired(INPUT_REPO_SECRET)
    const {branch, namespace, ssh_url, action} = slugPrContext(payload)

    const deploy = fluxDeploy({
      name: namespace,
      namespace,
      kustomization: {
        path: kPath
      },
      gitRepo: {
        branch,
        secretName: gitSecret,
        url: ssh_url
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
