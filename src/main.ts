import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {fluxDeploy} from './deploy'

import {slugurlref} from './slug'

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployImage'
const INPUT_NAMESPACE = 'namespace'
const INPUT_CMD = 'cmd'
const CMD_DEPLOY = 'deploy'
const CMD_DESTROY = 'destroy'
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
    const name = slugurlref(`${repo.name}-${branch}`)

    const gitSecret = core.getInput(INPUT_GIT_SECRET_NAME, {required: true})
    const pipelineRepo = core.getInput(INPUT_PIPELINE_REPO) || clone_url
    const pipelinePath = core.getInput(INPUT_PIPELINE_PATH, {required: true})
    const namespace = core.getInput(INPUT_NAMESPACE, {required: true})
    const deployImage = core.getInput(INPUT_DEPLOY_IMAGE)
    const cmd = core.getInput(INPUT_CMD, {required: true})

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
      image: deployImage
    })

    if (cmd === CMD_DESTROY) {
      await deploy.destroy()
    } else if (cmd === CMD_DEPLOY) {
      await deploy.deployOrRollout()
    } else {
      throw new Error(`Input "cmd" must be "destroy" or "deploy"`)
    }
  } catch (error) {
    if (error instanceof HttpError) {
      core.info(`HttpError ${error.statusCode}: ${JSON.stringify(error.body)}`)
    }
    if (error instanceof Error) {
      core.info(error.stack ?? '')
      core.setFailed(error.message)
    }
  }
}

run()
