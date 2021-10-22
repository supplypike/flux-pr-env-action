import * as core from '@actions/core'
// eslint-disable-next-line import/no-unresolved
import {PullRequestEvent} from '@octokit/webhooks-types'

import {K8sApi} from './api'
import {GitRepositorySpec} from './gitrepository'
import {helmrelease} from './helmrelease'
import {KustomizationSpec} from './kustomization'

export interface FluxDeployConfig {
  name: string
  namespace: string
  kustomization: {
    path: string
  }
  gitRepo: {
    branch: string
    secretName: string
    url: string
  }
  image: string
}

export interface Deploy {
  deploy(): Promise<void>
  destroy(): Promise<void>
  rollout(): Promise<void>
}

export async function handleDeployForAction(
  action: PullRequestEvent['action'],
  deploy: Deploy,
  force = false
): Promise<void> {
  if (force || action === 'opened' || action === 'reopened') {
    await deploy.deploy()
    return
  }

  if (action === 'closed') {
    await deploy.destroy()
    return
  }

  if (action === 'synchronize') {
    await deploy.rollout()
    return
  }
}

export function fluxDeploy(d: FluxDeployConfig): Deploy {
  const api = K8sApi()

  async function deploy(): Promise<void> {
    core.info(
      `deploying preview ${d.namespace}/${d.name} with image ${d.image}`
    )

    core.info(`creating Namespace`)
    await api.createNamespace(d.namespace)

    core.info(`creating Kustomization`)
    const kustomization: KustomizationSpec = {
      interval: '1m0s',
      path: d.kustomization.path,
      prune: true,
      sourceRef: {
        kind: 'GitRepository',
        name: d.name
      },
      patches: [
        {
          patch: `
            - op: replace
              path: /spec/values/image'
              value: ${d.image}
          `,
          target: {
            group: helmrelease.group,
            version: helmrelease.version,
            kind: helmrelease.kind,
            name: d.name
          }
        }
      ]
    }
    await api.createNamespacedKustomization(d.name, d.namespace, kustomization)

    core.info(`creating GitRepository`)
    const gitRepo: GitRepositorySpec = {
      interval: '1m0s',
      ref: {
        branch: d.gitRepo.branch
      },
      url: d.gitRepo.url,
      secretRef: {
        name: d.gitRepo.secretName
      }
    }
    await api.createNamespacedGitRepository(d.name, d.namespace, gitRepo)
  }
  async function destroy(): Promise<void> {
    core.info(`removing namespace ${d.namespace}`)
    await api.deleteNamespace(d.namespace)
  }

  async function rollout(): Promise<void> {
    core.info(`rollout image ${d.image}`)

    const patch = [
      {
        op: 'replace',
        path: '/spec/values/deployment',
        value: {
          image: d.image
        }
      }
    ]

    await api.patchNamespacedHelmRelease(d.name, d.namespace, patch)
  }

  return {
    deploy,
    destroy,
    rollout
  }
}
