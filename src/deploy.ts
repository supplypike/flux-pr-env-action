import * as core from '@actions/core'
import * as k8s from '@kubernetes/client-node'

import {Kustomization, kustomization} from './kustomization'
import {GitRepository, gitRepository} from './gitrepository'

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
const customApi = kc.makeApiClient(k8s.CustomObjectsApi)

const ns = (name: string): k8s.V1Namespace => {
  return {
    metadata: {
      name
    }
  }
}

async function createNamespacedKustomization(
  name: string,
  namespace: string,
  path: string
): Promise<void> {
  const payload: Kustomization = {
    metadata: {
      name,
      namespace
    },
    spec: {
      interval: '1m0s',
      path,
      prune: true,
      sourceRef: {
        kind: 'GitRepository',
        name
      }
    }
  }
  await customApi.createNamespacedCustomObject(
    ...kustomization(namespace),
    payload
  )
}

async function createNamespacedGitRepository(
  name: string,
  namespace: string,
  branch: string,
  url: string,
  secretName: string
): Promise<void> {
  const payload: GitRepository = {
    metadata: {
      name,
      namespace
    },
    spec: {
      interval: '1m0s',
      ref: {
        branch
      },
      url,
      secretRef: {
        name: secretName
      }
    }
  }
  await customApi.createNamespacedCustomObject(
    ...gitRepository(namespace),
    payload
  )
}

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
  rollout(): Promise<void>
}

export function fluxDeploy(d: FluxDeployConfig): Deploy {
  async function deploy(): Promise<void> {
    core.info(`deploy:\n ${JSON.stringify(d)}`)
    await k8sApi.createNamespace(ns(d.namespace))
    await createNamespacedKustomization(
      d.name,
      d.namespace,
      d.kustomization.path
    )
    await createNamespacedGitRepository(
      d.name,
      d.namespace,
      d.gitRepo.branch,
      d.gitRepo.url,
      d.gitRepo.secretName
    )
  }
  async function destroy(): Promise<void> {
    core.info(`removing namespace ${d.namespace}`)
    await k8sApi.deleteNamespace(d.namespace)
  }

  async function rollout(): Promise<void> {
    // patch deploy? HR? kustomization?
  }

  return {
    deploy,
    destroy,
    rollout
  }
}
