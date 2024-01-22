import {CustomObjectDefinition} from './api'

const HELM_RELEASE_API_GROUP = 'helm.toolkit.fluxcd.io'
const HELM_RELEASE_API_VERSION = 'v2beta2'
const HELM_RELEASE_PLURAL = 'helmreleases'
const HELM_RELEASE_KIND = 'HelmRelease'

export const helmRelease: CustomObjectDefinition = {
  group: HELM_RELEASE_API_GROUP,
  version: HELM_RELEASE_API_VERSION,
  kind: HELM_RELEASE_KIND,
  plural: HELM_RELEASE_PLURAL
}
