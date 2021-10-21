/* eslint-disable no-console */
import * as k8s from '@kubernetes/client-node'

import {kustomization, KustomizationSpec} from './kustomization'
import {gitRepository, GitRepositorySpec} from './gitrepository'
import {helmrelease} from './helmrelease'

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

function customObjectUri(def: CustomObjectDefinition, name: string): string {
  const [group, version, namespace, kind] = def.args
  return `/apis/${group}/${version}/namespaces/${namespace}/${kind}/${name}`
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
  const watch = new k8s.Watch(kc)

  async function waitNamespacedKustomization(
    name: string,
    namespace: string
  ): Promise<void> {
    const watchUri = `${customObjectUri(kustomization(namespace), name)}/status`
    const req = await watch.watch(
      watchUri,
      {},
      (type, apiObj, watchObj) => {
        if (type === 'ADDED') {
          // tslint:disable-next-line:no-console
          console.log('new object:')
        } else if (type === 'MODIFIED') {
          // tslint:disable-next-line:no-console
          console.log('changed object:')
        } else if (type === 'DELETED') {
          // tslint:disable-next-line:no-console
          console.log('deleted object:')
        } else if (type === 'BOOKMARK') {
          // tslint:disable-next-line:no-console
          console.log(`bookmark: ${watchObj.metadata.resourceVersion}`)
        } else {
          // tslint:disable-next-line:no-console
          console.log(`unknown type: ${type}`)
        }
        // tslint:disable-next-line:no-console
        console.log(apiObj)
      },
      // done callback is called if the watch terminates normally
      () => {
        // tslint:disable-next-line:no-console
        console.log('done')
      },
      err => {
        // tslint:disable-next-line:no-console
        console.log(err)
      }
    )

    // watch returns a request object which you can use to abort the watch.
    setTimeout(() => {
      req.abort()
    }, 10 * 1000)

    // if (!res.body.hasOwnProperty('metadata')) {
    //   console.log('did not find metadata, check payload?')
    //   console.log(JSON.stringify(res.body))
    //   continue
    // }

    // const body = res.body as CustomObjectWithStatus<KustomizationSpec>
    // if (!body.status) {
    //   console.log('did not find status')
    //   console.log(JSON.stringify(body))
    //   continue
    // }

    // const {conditions} = body.status
    // if (!conditions) {
    //   console.log('did not find conditions')
    //   console.log(JSON.stringify(body.status))
    //   continue
    // }

    // for (const condition of conditions) {
    //   if (condition.type === 'Ready' && condition.status === 'True') {
    //     console.log('ready!')
    //     return
    //   }
    // }
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
