/* eslint-disable no-console */
import * as k8s from '@kubernetes/client-node'

import {kustomization, KustomizationSpec} from './kustomization'
import {gitRepository, GitRepositorySpec} from './gitrepository'
import {helmrelease} from './helmrelease'
import {delay} from './utils'

export interface Api {
  createNamespacedKustomization(
    name: string,
    namespace: string,
    path: string
  ): Promise<void>
  waitNamespacedKustomization(name: string, namespace: string): Promise<void>

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

interface K8sCondition {
  lastTransitionTime: Date
  message: string
  reason: string
  status: string
  type: string
}

interface K8sStatus {
  conditions?: K8sCondition[]
}

export interface CustomObject<Spec> {
  apiVersion: string
  kind: string
  metadata: {
    name: string
    namespace: string
  }
  spec: Spec
}

export interface CustomObjectWithStatus<Spec> extends CustomObject<Spec> {
  status?: K8sStatus
}

export type CustomObjectApiArgs = [
  group: string,
  version: string,
  namespace: string,
  kind: string
]

export interface CustomObjectDefinition {
  args: CustomObjectApiArgs
  apiVersion: string
  kind: string
  namespace: string
}

function payload<Spec>(
  name: string,
  {apiVersion, kind, namespace}: CustomObjectDefinition,
  spec: Spec
): CustomObject<Spec> {
  return {
    apiVersion,
    kind,
    metadata: {
      name,
      namespace
    },
    spec
  }
}

export function K8sApi(): Api {
  const kc = new k8s.KubeConfig()
  kc.loadFromDefault()

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
  const customApi = kc.makeApiClient(k8s.CustomObjectsApi)

  async function waitNamespacedKustomization(
    name: string,
    namespace: string
  ): Promise<void> {
    const RETRIES = 5
    const RETRY_DELAY_SECONDS = 10

    for (let i = 0; i < RETRIES; i++) {
      if (i > 1) {
        console.log(`Retrying in ${RETRY_DELAY_SECONDS} seconds...`)
        await delay(RETRY_DELAY_SECONDS)
      }
      console.log(`TRY ${i + 1}`)

      const res = await customApi.getNamespacedCustomObjectStatus(
        ...kustomization(namespace).args,
        name
      )

      if (!res.body.hasOwnProperty('metadata')) {
        console.log('did not find metadata, check payload?')
        console.log(JSON.stringify(res.body))
        continue
      }

      const body = res.body as CustomObjectWithStatus<KustomizationSpec>
      if (!body.status) {
        console.log('did not find status')
        console.log(JSON.stringify(body))
        continue
      }

      const {conditions} = body.status
      if (!conditions) {
        console.log('did not find conditions')
        console.log(JSON.stringify(body.status))
        continue
      }

      for (const condition of conditions) {
        if (condition.type === 'Ready' && condition.status === 'True') {
          console.log('ready!')
          return
        }
      }
    }
  }

  async function createNamespacedKustomization(
    name: string,
    namespace: string,
    path: string
  ): Promise<void> {
    const spec: KustomizationSpec = {
      interval: '1m0s',
      path,
      prune: true,
      sourceRef: {
        kind: 'GitRepository',
        name
      }
    }
    const k = kustomization(namespace)
    await customApi.createNamespacedCustomObject(
      ...k.args,
      payload(name, k, spec)
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
      ...helmrelease(namespace).args,
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
    const spec: GitRepositorySpec = {
      interval: '1m0s',
      ref: {
        branch
      },
      url,
      secretRef: {
        name: secretName
      }
    }
    const g = gitRepository(namespace)
    await customApi.createNamespacedCustomObject(
      ...g.args,
      payload(name, g, spec)
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
    waitNamespacedKustomization,
    createNamespacedGitRepository,
    createNamespace,
    deleteNamespace,
    patchNamespacedHelmRelease
  }
}
