import * as core from '@actions/core'
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
}

export interface Deploy {
  deploy(image: string): Promise<void>
  destroy(): Promise<void>
  rollout(image: string): Promise<void>
}

export function fluxDeploy(d: FluxDeployConfig): Deploy {
  const api = K8sApi()

  async function deploy(image: string): Promise<void> {
    core.info(`deploying preview ${d.namespace}/${d.name}`)

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
          patch: [
            {
              op: 'replace',
              path: '/spec/values/image',
              value: image
            }
          ],
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
