import * as k8s from '@kubernetes/client-node'

import {Kustomization, kustomization} from './kustomization'
import {GitRepository, gitRepository} from './gitrepository'
import {helmrelease} from './helmrelease'

export interface Api {
  createNamespacedKustomization(
    name: string,
    namespace: string,
    path: string
  ): Promise<void>
  createNamespacedGitRepository(
    name: string,
    namespace: string,
    branch: string,
    url: string,
    secretName: string
  ): Promise<void>
  patchNamespacedHelmRelease(
    name: string,
    namespace: string,
    patch: K8sPatch[]
  ): Promise<void>
  createNamespace(namespace: string): Promise<void>
  deleteNamespace(namespace: string): Promise<void>
}

interface K8sPatch {
  op: string
  path: string
  value: {
    [name: string]: string
  }
}

export function K8sApi(): Api {
  const kc = new k8s.KubeConfig()
  kc.loadFromDefault()

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
  const customApi = kc.makeApiClient(k8s.CustomObjectsApi)

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

  async function patchNamespacedHelmRelease(
    name: string,
    namespace: string,
    patch: K8sPatch[]
  ): Promise<void> {
    const options = {
      headers: {'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH}
    }
    await customApi.patchNamespacedCustomObject(
      ...helmrelease(namespace),
      name,
      patch,
      undefined,
      undefined,
      undefined,
      options
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

  async function createNamespace(namespace: string): Promise<void> {
    await k8sApi.createNamespace({
      metadata: {
        name: namespace
      }
    })
  }

  async function deleteNamespace(namespace: string): Promise<void> {
    await k8sApi.deleteNamespace(namespace)
  }

  return {
    createNamespacedKustomization,
    createNamespacedGitRepository,
    createNamespace,
    deleteNamespace,
    patchNamespacedHelmRelease
  }
}
