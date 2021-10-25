import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {fluxDeploy} from './deploy'

import {slugurlref} from './slug'
import {getInputRequired} from './utils'

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployImage'
const INPUT_NAMESPACE = 'namespace'
const INPUT_CMD = 'cmd'
const CMD_DEPLOY = 'deploy'
const CMD_DESTROY = 'destroy'

async function run(): Promise<void> {
  try {
    if (github.context.eventName !== 'pull_request') {
      return
    }

    const payload = github.context.payload as PullRequestEvent
    const {repo, ref} = payload.pull_request.head
    const branch = slugurlref(ref)
    const {clone_url} = repo
    const name = slugurlref(`${repo.name}-${branch}`)

    const gitSecret = getInputRequired(INPUT_GIT_SECRET_NAME, 'github-token')
    const pipelineRepo = getInputRequired(INPUT_PIPELINE_REPO, clone_url)
    const pipelinePath = getInputRequired(INPUT_PIPELINE_PATH)
    const namespace = getInputRequired(INPUT_NAMESPACE)
    const deployImage = core.getInput(INPUT_DEPLOY_IMAGE)
    const cmd = getInputRequired(INPUT_CMD)

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
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
