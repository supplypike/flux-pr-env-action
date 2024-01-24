import {CustomObjectDefinition} from './api'

export interface GitRepositorySpec {
  interval?: string
  ref: {
    branch: string
  }
  url: string
  secretRef: {
    name: string
  }
}

const GIT_SOURCE_API_GROUP = 'source.toolkit.fluxcd.io'
const GIT_SOURCE_API_VERSION = 'v1'
const GITREPO_PLURAL = 'gitrepositories'
const GITREPO_KIND = 'GitRepository'

export const gitRepository: CustomObjectDefinition = {
  group: GIT_SOURCE_API_GROUP,
  version: GIT_SOURCE_API_VERSION,
  kind: GITREPO_KIND,
  plural: GITREPO_PLURAL
}
