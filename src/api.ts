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
  const k8sWatch = new k8s.Watch(kc)

  function checkCondition<T>(
    obj: CustomObjectWithStatus<unknown>,
    conditionType: string,
    conditionStatus: string
  ): boolean {
    const conditions = obj.status?.conditions
    if (!conditions) {
      return false
    }

    for (const condition of conditions) {
      console.log(condition)
      if (condition.type === conditionType && condition.status === conditionStatus) {
        return true
      }
    }

    return false
  }

  async function waitForCondition(
    uri: string,
    conditionType: string,
    conditionStatus: string,
    attempts = 10,
  ): Promise<void> {
    for (let i=1; i<=attempts; i++) {
      try {
        await watch(uri, obj => {
          return checkCondition(obj, conditionType, conditionStatus)
        })
      } catch(error) {
        throw new Error(`Failed waiting for condition ${conditionType} ${conditionStatus} on resource ${uri}\n${error}`)
      }
    }
  }

  async function watch(
    uri: string,
    isDone: (obj: CustomObjectWithStatus<unknown>) => boolean
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      k8sWatch
        .watch(
          uri,
          {},
          (type, apiObj, watchObj) => {
            console.log({type, apiObj, watchObj})
            resolve(watchObj)
          },
          // done callback is called if the watch terminates normally
          () => {
            console.log('done')
            reject(new Error('done but no watch'))
          },
          err => {
            console.log('watch err', err)
            reject(err)
          }
        )
        // eslint-disable-next-line github/no-then
        .then(req => {
          setTimeout(() => {
            req.abort()
            reject(new Error('aborted watch'))
          }, 60 * 1000)
        })
    })

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

  async function waitNamespacedKustomization(
    name: string,
    namespace: string
  ): Promise<void> {
    const watchUri = `${customObjectUri(kustomization(namespace), name)}`
    console.log(`watchUri: ${watchUri}`)
 
      await watch<CustomObjectWithStatus<KustomizationSpec>>(watchUri, obj => {
        checkCondition(obj, 'Ready')
      }
        
      )
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
