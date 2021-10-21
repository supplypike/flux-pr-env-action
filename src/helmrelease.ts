import {CustomObjectDefinition} from './api'

export interface HelmReleaseSpec {
  values: object
}

const HELM_API_GROUP = 'helm.toolkit.fluxcd.io'
const HELM_API_VERSION = 'v2beta1'
const HELMRELEASE_PLURAL = 'helmreleases'
const HELMRELEASE_KIND = 'HelmRelease'

export const helmrelease: CustomObjectDefinition = {
  group: HELM_API_GROUP,
  version: HELM_API_VERSION,
  kind: HELMRELEASE_KIND,
  plural: HELMRELEASE_PLURAL
}
