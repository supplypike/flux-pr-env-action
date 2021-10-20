import {CustomObject, CustomObjectApiPatchFactory} from './api'

export interface HelmReleaseSpec {
  values: object
}

export type HelmRelease = CustomObject<HelmReleaseSpec>

const HELM_API_GROUP = 'helm.toolkit.fluxcd.io'
const HELM_API_VERSION = 'v2beta1'
const HELMRELEASE_PLURAL = 'helmreleases'

export const helmrelease: CustomObjectApiPatchFactory = (
  name: string,
  namespace: string
) => {
  const group = HELM_API_GROUP
  const version = HELM_API_VERSION
  const kind = HELMRELEASE_PLURAL
  return [group, version, namespace, kind, name]
}
