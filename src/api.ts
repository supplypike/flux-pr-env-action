import * as k8s from '@kubernetes/client-node'

import {kustomization, KustomizationSpec} from './kustomization'
import {gitRepository, GitRepositorySpec} from './gitrepository'
import {ActionOnInvalid} from '@kubernetes/client-node/dist/config_types'

export interface Api {
  getNamespacedKustomization(
    name: string,
    namespace: string
  ): Promise<CustomObject<KustomizationSpec>>
  createNamespacedKustomization(
    name: string,
    namespace: string,
    spec: KustomizationSpec
  ): Promise<void>
  patchNamespacedKustomization(
    name: string,
    namespace: string,
    patch: K8sPatch[]
  ): Promise<void>
  deleteNamespacedKustomization(name: string, namespace: string): Promise<void>

  createNamespacedGitRepository(
    name: string,
    namespace: string,
    spec: GitRepositorySpec
  ): Promise<void>
  deleteNamespacedGitRepository(name: string, namespace: string): Promise<void>
}

interface K8sPatch {
  op: string
  path: string
  value: string | object
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
  group: string
  version: string
  plural: string
  kind: string
}

function namespacedCustomObjectArgs(
  namespace: string,
  o: CustomObjectDefinition
): CustomObjectApiArgs {
  const {group, version, plural} = o
  return [group, version, namespace, plural]
}

function payload<Spec>(
  name: string,
  namespace: string,
  {group, version, kind}: CustomObjectDefinition,
  spec: Spec
): CustomObject<Spec> {
  return {
    apiVersion: `${group}/${version}`,
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
  kc.loadFromDefault({
    onInvalidEntry: ActionOnInvalid.THROW
  })

  const customApi = kc.makeApiClient(k8s.CustomObjectsApi)

  async function getNamespacedKustomization(
    name: string,
    namespace: string
  ): Promise<CustomObject<KustomizationSpec>> {
    const res = await customApi.getNamespacedCustomObject(
      ...namespacedCustomObjectArgs(namespace, kustomization),
      name
    )

    return res.body as CustomObject<KustomizationSpec>
  }

  async function createNamespacedKustomization(
    name: string,
    namespace: string,
    spec: KustomizationSpec
  ): Promise<void> {
    await customApi.createNamespacedCustomObject(
      ...namespacedCustomObjectArgs(namespace, kustomization),
      payload(name, namespace, kustomization, spec)
    )
  }

  async function patchNamespacedKustomization(
    name: string,
    namespace: string,
    patch: K8sPatch[]
  ): Promise<void> {
    const options = {
      headers: {'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH}
    }
    await customApi.patchNamespacedCustomObject(
      ...namespacedCustomObjectArgs(namespace, kustomization),
      name,
      patch,
      undefined,
      undefined,
      undefined,
      options
    )
  }

  async function deleteNamespacedKustomization(
    name: string,
    namespace: string
  ): Promise<void> {
    await customApi.deleteNamespacedCustomObject(
      ...namespacedCustomObjectArgs(namespace, kustomization),
      name
    )
  }

  async function createNamespacedGitRepository(
    name: string,
    namespace: string,
    spec: GitRepositorySpec
  ): Promise<void> {
    await customApi.createNamespacedCustomObject(
      ...namespacedCustomObjectArgs(namespace, gitRepository),
      payload(name, namespace, gitRepository, spec)
    )
  }

  async function deleteNamespacedGitRepository(
    name: string,
    namespace: string
  ): Promise<void> {
    await customApi.deleteNamespacedCustomObject(
      ...namespacedCustomObjectArgs(namespace, gitRepository),
      name
    )
  }

  return {
    getNamespacedKustomization,
    createNamespacedKustomization,
    patchNamespacedKustomization,
    deleteNamespacedKustomization,

    createNamespacedGitRepository,
    deleteNamespacedGitRepository
  }
}
