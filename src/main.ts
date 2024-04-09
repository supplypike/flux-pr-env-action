import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpError} from '@kubernetes/client-node'
import {PullRequestEvent} from '@octokit/webhooks-types'

import {fluxDeploy} from './deploy'
import {handlePullRequest} from './pullrequest'
import {formatInputs, getConfig} from './config'

const EVENT_PULL_REQUEST = 'pull_request'

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
