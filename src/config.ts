import { createHash } from 'node:crypto'
import * as core from '@actions/core'
import type { PullRequestEvent } from '@octokit/webhooks-types'

import type { FluxDeployConfig } from './deploy'
import { slugurl, slugurlref } from './slug'

// Helm caps release names at 53 bytes. Preview templates name the release
// `<serviceName>-${branch}`, so the branch must fit in what the service name
// leaves over.
const MAX_RELEASE_NAME_LENGTH = 53
const HASH_LENGTH = 6

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_PIPELINE_BRANCH = 'pipelineBranch'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployTag'
const INPUT_NAMESPACE = 'namespace'
const INPUT_SERVICENAME = 'serviceName'
const INPUT_SKIP_CHECK = 'skipCheck'
const INPUT_GIT_PROVIDER = 'gitProvider'

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
  gitProvider: string
}

/**
 * previewBranch shortens the slugged branch so `<serviceName>-<branch>` fits
 * in a Helm release name. Branches that already fit are returned unchanged.
 * Shortened branches end in a hash of the full ref so two long branches with
 * the same prefix still get different names.
 */
export function previewBranch(serviceName: string, ref: string): string {
  const branch = slugurlref(ref)
  const budget = MAX_RELEASE_NAME_LENGTH - serviceName.length - 1
  if (branch.length <= budget) {
    return branch
  }

  const prefixLength = budget - HASH_LENGTH - 1
  if (prefixLength < 1) {
    throw new Error(
      `serviceName "${serviceName}" is too long to build a preview name within ${MAX_RELEASE_NAME_LENGTH} characters`
    )
  }

  const hash = createHash('sha256')
    .update(ref)
    .digest('hex')
    .substring(0, HASH_LENGTH)
  const prefix = branch.substring(0, prefixLength).replace(/-+$/, '')
  return `${prefix}-${hash}`
}

export function formatInputs(
  payload: PullRequestEvent,
  getInput = core.getInput,
  getBooleanInput = core.getBooleanInput
): FormattedInputs {
  const { repo, ref } = payload.pull_request.head
  if (!repo) {
    throw new Error('No repo found in payload')
  }
  const { clone_url } = repo
  const repoName = slugurl(repo.name)

  const gitSecret = getInput(INPUT_GIT_SECRET_NAME, { required: true })
  const pipelineRepo = getInput(INPUT_PIPELINE_REPO) || clone_url
  const pipelinePath = getInput(INPUT_PIPELINE_PATH, { required: true })
  const pipelineBranch = getInput(INPUT_PIPELINE_BRANCH) || 'main'
  const namespace = getInput(INPUT_NAMESPACE, { required: true })
  const deployTag = getInput(INPUT_DEPLOY_IMAGE, { required: true })
  const serviceName = getInput(INPUT_SERVICENAME) || repoName
  const skipCheck = getBooleanInput(INPUT_SKIP_CHECK)
  const branchKubeNameClean = previewBranch(serviceName, ref)
  const name = slugurlref(`${serviceName}-${branchKubeNameClean}`)
  const gitProvider = getInput(INPUT_GIT_PROVIDER) || 'github'

  return {
    branchKubeNameClean,
    gitSecret,
    pipelineRepo,
    pipelinePath,
    pipelineBranch,
    namespace,
    deployTag,
    skipCheck,
    name,
    gitProvider
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
      secretName: inputs.gitSecret,
      provider: inputs.gitProvider
    },
    imageTag: inputs.deployTag,
    branch: inputs.branchKubeNameClean
  }
}
