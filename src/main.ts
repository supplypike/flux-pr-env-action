import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types' // eslint-disable-line import/no-unresolved
import {fluxDeploy} from './deploy'
import {handlePullRequest} from './pullrequest'

import {removeRef, slugurlref} from './slug'

const INPUT_PIPELINE_PATH = 'pipelinePath'
const INPUT_PIPELINE_REPO = 'pipelineRepo'
const INPUT_GIT_SECRET_NAME = 'secretName'
const INPUT_DEPLOY_IMAGE = 'deployTag'
const INPUT_NAMESPACE = 'namespace'
const INPUT_SERVICENAME = 'serviceName'
const INPUT_SKIP_CHECK = 'skipCheck'
const EVENT_PULL_REQUEST = 'pull_request'

interface FormattedInputs {
  payload: PullRequestEvent
  ref: string
  branch: string
  repoName: string
  gitSecret: string
  pipelineRepo: string
  pipelinePath: string
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
  const branch = slugurlref(ref)
  const {clone_url} = repo
  const repoName = `${repo.name}-${branch}`

  const gitSecret = getInput(INPUT_GIT_SECRET_NAME, {required: true})
  const pipelineRepo = getInput(INPUT_PIPELINE_REPO) || clone_url
  const pipelinePath = getInput(INPUT_PIPELINE_PATH, {required: true})
  const namespace = getInput(INPUT_NAMESPACE, {required: true})
  const deployTag = getInput(INPUT_DEPLOY_IMAGE, {required: true})
  const serviceName = getInput(INPUT_SERVICENAME) || repoName
  const skipCheck = getBooleanInput(INPUT_SKIP_CHECK)
  const name = slugurlref(`${serviceName}-${branch}`)

  return {
    payload,
    ref,
    branch,
    repoName,
    gitSecret,
    pipelineRepo,
    pipelinePath,
    namespace,
    deployTag,
    skipCheck,
    name
  }
}

async function run(): Promise<void> {
  try {
    if (github.context.eventName !== EVENT_PULL_REQUEST) {
      return
    }

    const {
      payload,
      ref,
      branch,
      gitSecret,
      pipelineRepo,
      pipelinePath,
      namespace,
      deployTag,
      skipCheck,
      name
    } = formatInputs(github.context.payload as PullRequestEvent)

    const deploy = fluxDeploy({
      name,
      namespace,
      kustomization: {
        path: pipelinePath,
        branch
      },
      gitRepo: {
        branch: removeRef(ref),
        secretName: gitSecret,
        url: pipelineRepo
      },
      imageTag: deployTag
    })

    if (skipCheck) {
      await deploy.deployOrRollout()
    } else {
      await handlePullRequest(payload, deploy)
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
