import * as core from '@actions/core'

import {K8sApi} from './api'
import {GitRepositorySpec} from './gitrepository'
import {KustomizationSpec} from './kustomization'

export interface FluxDeployConfig {
  name: string
  namespace: string
  kustomization: {
    path: string
    branch: string
  }
  gitRepo: {
    branch: string
    secretName: string
    url: string
  }
  imageTag: string
}

export interface Deploy {
  destroy(): Promise<void>
  // perform a rollout if the deploy already exists
  deployOrRollout(): Promise<void>
}

export function fluxDeploy(d: FluxDeployConfig, api = K8sApi()): Deploy {
  async function deploy(): Promise<void> {
    core.info(
      `deploying preview "${d.namespace}/${d.name}" with tag "${d.imageTag}"`
    )

    const kustomization: KustomizationSpec = {
      interval: '1m0s',
      path: d.kustomization.path,
      prune: true,
      sourceRef: {
        kind: 'GitRepository',
        name: d.name
      },
      targetNamespace: d.namespace,
      postBuild: {
        substitute: {
          branch: d.kustomization.branch,
          image_tag: d.imageTag
        }
      }
    }
    await api.createNamespacedKustomization(d.name, d.namespace, kustomization)

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
    await api.deleteNamespacedKustomization(d.name, d.namespace)
    await api.deleteNamespacedGitRepository(d.name, d.namespace)
  }

  async function rollout(): Promise<void> {
    core.info(`rollout image ${d.imageTag}`)
    const patch = [
      {
        op: 'replace',
        path: '/spec/postBuild/substitute/image_tag',
        value: d.imageTag
      }
    ]

    await api.patchNamespacedKustomization(d.name, d.namespace, patch)
  }

  async function deployOrRollout(): Promise<void> {
    core.info(`checking for existing deploy ${d.namespace}/${d.name}`)

    let found = false
    try {
      if (await api.getNamespacedKustomization(d.name, d.namespace)) {
        found = true
      }
    } catch (ex) {
      // swallow error
    }

    if (found) {
      core.info('found deploy')
      await rollout()
    } else {
      core.info('creating deploy')
      await deploy()
    }
  }

  return {
    destroy,
    deployOrRollout
  }
}
