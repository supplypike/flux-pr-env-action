import * as core from '@actions/core'
import {K8sApi} from './api'

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
}

export interface Deploy {
  deploy(): Promise<void>
  destroy(): Promise<void>
  rollout(image: string): Promise<void>
}

export function fluxDeploy(d: FluxDeployConfig): Deploy {
  const api = K8sApi()

  async function deploy(): Promise<void> {
    core.info(`deploy:\n ${JSON.stringify(d)}`)

    core.info(`creating namespace ${d.namespace}`)
    await api.createNamespace(d.namespace)

    core.info(`creating k11n`)
    await api.createNamespacedKustomization(
      d.name,
      d.namespace,
      d.kustomization.path
    )

    core.info(`creating git repo`)
    await api.createNamespacedGitRepository(
      d.name,
      d.namespace,
      d.gitRepo.branch,
      d.gitRepo.url,
      d.gitRepo.secretName
    )
  }
  async function destroy(): Promise<void> {
    core.info(`removing namespace ${d.namespace}`)
    await api.deleteNamespace(d.namespace)
  }

  async function rollout(image: string): Promise<void> {
    core.info(`rollout image ${image}`)

    const patch = [
      {
        op: 'replace',
        path: '/spec/values/deployment',
        value: {
          image
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
