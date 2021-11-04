import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {fluxDeploy} from './deploy'

import {slugurlref} from './slug'

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployTag'
const INPUT_NAMESPACE = 'namespace'
const INPUT_SERVICENAME = 'serviceName'
const EVENT_PULL_REQUEST = 'pull_request'

async function run(): Promise<void> {
  try {
    if (github.context.eventName !== EVENT_PULL_REQUEST) {
      return
    }

    const payload = github.context.payload as PullRequestEvent
    const {repo, ref} = payload.pull_request.head
    const branch = slugurlref(ref)
    const {clone_url} = repo
    const repoName = slugurlref(`${repo.name}-${branch}`)

    const gitSecret = core.getInput(INPUT_GIT_SECRET_NAME, {required: true})
    const pipelineRepo = core.getInput(INPUT_PIPELINE_REPO) || clone_url
    const pipelinePath = core.getInput(INPUT_PIPELINE_PATH, {required: true})
    const namespace = core.getInput(INPUT_NAMESPACE, {required: true})
    const deployTag = core.getInput(INPUT_DEPLOY_IMAGE, {required: true})
    const name = core.getInput(INPUT_SERVICENAME) || repoName

    const deploy = fluxDeploy({
      name,
      namespace,
      kustomization: {
        path: pipelinePath
      },
      gitRepo: {
        branch,
        secretName: gitSecret,
        url: pipelineRepo
      },
      imageTag: deployTag
    })

    let hasLabel =
      payload.pull_request.labels.findIndex(l => l.name === 'preview') > -1
    if (payload.action === 'labeled' || payload.action === 'unlabeled') {
      hasLabel = payload.label.name === 'preview'
    }

    if (!hasLabel) {
      core.info('No "preview" tag, gracefully exiting')
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
  } catch (error) {
    if (error instanceof HttpError) {
      core.info(`HttpError ${error.statusCode}: ${JSON.stringify(error.body)}`)
      core.info(JSON.stringify(error.response))
    }
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
