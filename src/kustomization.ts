import {CustomObjectDefinition} from './api'

interface KustomizePatch {
  patch: {
    op: string
    path: string
    value: string
  }[]
  target: {
    kind?: string
    version?: string
    group?: string
    name?: string
  }
}

export interface KustomizationSpec {
  interval?: string
  path: string
  prune?: boolean
  sourceRef: {
    kind: string
    name: string
  }
  patches?: KustomizePatch[]
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
