import {CustomObjectDefinition} from './api'

export interface HelmReleaseSpec {
  values: object
}

const HELM_API_GROUP = 'helm.toolkit.fluxcd.io'
const HELM_API_VERSION = 'v2beta1'
const HELM_API = `${HELM_API_GROUP}/${HELM_API_VERSION}`
const HELMRELEASE_PLURAL = 'helmreleases'
const HELMRELEASE_KIND = 'HelmRelease'

export const helmrelease = (namespace: string): CustomObjectDefinition => {
  return {
    args: [HELM_API_GROUP, HELM_API_VERSION, namespace, HELMRELEASE_PLURAL],
    apiVersion: HELM_API,
    kind: HELMRELEASE_KIND,
    namespace
  }
}
