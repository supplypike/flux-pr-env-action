import * as core from '@actions/core'

import {K8sApi} from './api'
import {GitRepositorySpec} from './gitrepository'
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
  imageTag: string
}

export interface Deploy {
  deploy(): Promise<void>
  destroy(): Promise<void>
  rollout(): Promise<void>
  // perform a rollout if the deploy already exists
  deployOrRollout(): Promise<void>
}

export function fluxDeploy(d: FluxDeployConfig): Deploy {
  const api = K8sApi()

  async function deploy(): Promise<void> {
    core.info(
      `deploying preview ${d.namespace}/${d.name} with tag ${d.imageTag}`
    )

    core.info(`creating Kustomization`)
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
          preview_name: d.name,
          image_tag: d.imageTag
        }
      }
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
    core.info(`removing kustomization ${d.name}`)
    await api.deleteNamespacedKustomization(d.name, d.namespace)
    core.info(`removing gitrepository ${d.name}`)
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
    deploy,
    destroy,
    rollout,
    deployOrRollout
  }
}
