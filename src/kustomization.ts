import {CustomObjectDefinition} from './api'

export interface KustomizationSpec {
  interval?: string
  path: string
  prune?: boolean
  sourceRef: {
    kind: string
    name: string
  }
  targetNamespace: string
  postBuild?: {
    substitute: {
      [key: string]: string
    }
  }
}

const KUSTOMIZE_API_GROUP = 'kustomize.toolkit.fluxcd.io'
const KUSTOMIZE_API_VERSION = 'v1beta1'
const KUSTOMIZATION_PLURAL = 'kustomizations'
const KUSTOMIZATION_KIND = 'Kustomization'

export const kustomization: CustomObjectDefinition = {
  group: KUSTOMIZE_API_GROUP,
  version: KUSTOMIZE_API_VERSION,
  plural: KUSTOMIZATION_PLURAL,
  kind: KUSTOMIZATION_KIND
}
