import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types'

import {fluxDeploy, FluxDeployConfig} from './deploy'
import {handlePullRequest} from './pullrequest'
import {slugurl, slugurlref} from './slug'

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_PIPELINE_BRANCH = 'pipelineBranch'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployTag'
const INPUT_NAMESPACE = 'namespace'
const INPUT_SERVICENAME = 'serviceName'
const INPUT_SKIP_CHECK = 'skipCheck'
const EVENT_PULL_REQUEST = 'pull_request'

export interface FormattedInputs {
  branchKubeNameClean: string
  gitSecret: string
  pipelineRepo: string
  pipelinePath: string
  pipelineBranch: string
  namespace: string
  deployTag: string
  skipCheck: boolean
  name: string
}

export function formatInputs(
  payload: PullRequestEvent,
  getInput = core.getInput,
  getBooleanInput = core.getBooleanInput
): FormattedInputs {
  const {repo, ref} = payload.pull_request.head
  const branchKubeNameClean = slugurlref(ref)
  const {clone_url} = repo
  const repoName = slugurl(repo.name)

  const gitSecret = getInput(INPUT_GIT_SECRET_NAME, {required: true})
  const pipelineRepo = getInput(INPUT_PIPELINE_REPO) || clone_url
  const pipelinePath = getInput(INPUT_PIPELINE_PATH, {required: true})
  const pipelineBranch = getInput(INPUT_PIPELINE_BRANCH) || 'main'
  const namespace = getInput(INPUT_NAMESPACE, {required: true})
  const deployTag = getInput(INPUT_DEPLOY_IMAGE, {required: true})
  const serviceName = getInput(INPUT_SERVICENAME) || repoName
  const skipCheck = getBooleanInput(INPUT_SKIP_CHECK)
  const name = slugurlref(`${serviceName}-${branchKubeNameClean}`)

  return {
    branchKubeNameClean,
    gitSecret,
    pipelineRepo,
    pipelinePath,
    pipelineBranch,
    namespace,
    deployTag,
    skipCheck,
    name
  }
}

export function getConfig(inputs: FormattedInputs): FluxDeployConfig {
  return {
    name: inputs.name,
    namespace: inputs.namespace,
    pipeline: {
      path: inputs.pipelinePath,
      url: inputs.pipelineRepo,
      branch: inputs.pipelineBranch,
      secretName: inputs.gitSecret
    },
    imageTag: inputs.deployTag,
    branch: inputs.branchKubeNameClean
  }
}

async function run(): Promise<void> {
  try {
    if (github.context.eventName !== EVENT_PULL_REQUEST) {
      return
    }

    const payload = github.context.payload as PullRequestEvent
    const inputs = formatInputs(payload)
    const {skipCheck, name} = inputs
    const deploy = fluxDeploy(getConfig(inputs))

    const handleDeploy = async (): Promise<void> => deploy.deployOrRollout()
    const handleDestroy = async (): Promise<void> => deploy.destroy()

    if (skipCheck) {
      await handleDeploy()
    } else {
      await handlePullRequest(payload, handleDeploy, handleDestroy)
    }

    core.setOutput('deployName', name)
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
