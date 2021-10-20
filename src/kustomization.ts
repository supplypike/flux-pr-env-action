import {CustomObject, CustomObjectApiArgFactory} from './api'

export interface KustomizationSpec {
  interval?: string
  path: string
  prune?: boolean
  sourceRef: {
    kind: string
    name: string
  }
}

export type Kustomization = CustomObject<KustomizationSpec>

const KUSTOMIZE_API_GROUP = 'kustomize.toolkit.fluxcd.io'
const KUSTOMIZE_API_VERSION = 'v1beta1'
const KUSTOMIZE_API = `${KUSTOMIZE_API_GROUP}/${KUSTOMIZE_API_VERSION}`
const KUSTOMIZATION_PLURAL = 'kustomizations'
const KUSTOMIZATION_KIND = 'Kustomization'

export const kustomization: CustomObjectApiArgFactory<KustomizationSpec> = (
  name: string,
  namespace: string,
  spec: KustomizationSpec
): [string, string, string, string, Kustomization] => {
  const payload: Kustomization = {
    apiVersion: KUSTOMIZE_API,
    kind: KUSTOMIZATION_KIND,
    metadata: {
      name,
      namespace
    },
    spec
  }
  return [
    KUSTOMIZE_API_GROUP,
    KUSTOMIZE_API_VERSION,
    namespace,
    KUSTOMIZATION_PLURAL,
    payload
  ]
}
