import * as core from '@actions/core'
import {PullRequestEvent} from '@octokit/webhooks-types'

import {FluxDeployConfig} from './deploy'
import {slugurl, slugurlref} from './slug'

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_PIPELINE_BRANCH = 'pipelineBranch'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployTag'
const INPUT_NAMESPACE = 'namespace'
const INPUT_SERVICENAME = 'serviceName'
const INPUT_SKIP_CHECK = 'skipCheck'

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
  if (!repo) {
    throw new Error('No repo found in payload')
  }
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
