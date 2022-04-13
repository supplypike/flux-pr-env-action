import {CustomObjectDefinition} from './api'

const GIT_SOURCE_API_GROUP = 'helm.toolkit.fluxcd.io'
const GIT_SOURCE_API_VERSION = 'v2beta1'
const GITREPO_PLURAL = 'helmreleases'
const GITREPO_KIND = 'HelmRelease'

export const helmRelease: CustomObjectDefinition = {
  group: GIT_SOURCE_API_GROUP,
  version: GIT_SOURCE_API_VERSION,
  kind: GITREPO_KIND,
  plural: GITREPO_PLURAL
}
