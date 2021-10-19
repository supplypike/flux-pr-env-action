import * as core from '@actions/core'
import * as github from '@actions/github'
import {fluxDeploy} from './deploy'

import {slugPrContext} from './slug'
import {getInputRequired} from './utils'

const INPUT_KUSTOMIZE_PATH = 'kustomizePath'
const INPUT_REPO_SECRET = 'repoSecret'

async function run(): Promise<void> {
  try {
    const kPath = getInputRequired(INPUT_KUSTOMIZE_PATH)
    const gitSecret = getInputRequired(INPUT_REPO_SECRET)
    const {branch, namespace, ssh_url, action} = slugPrContext(github.context)

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
      deploy.deploy()
    }

    if (action === 'closed') {
      deploy.destroy()
    }

    if (action === 'synchronize') {
      deploy.rollout()
    }
  } catch (error) {
    console.log(error) // eslint-disable-line no-console
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
