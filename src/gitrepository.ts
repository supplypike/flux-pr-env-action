import {CustomObject, CustomObjectDefinition} from './api'

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

export type GitRepository = CustomObject<GitRepositorySpec>

const GIT_SOURCE_API_GROUP = 'source.toolkit.fluxcd.io'
const GIT_SOURCE_API_VERSION = 'v1beta1'
const GIT_SOURCE_API = `${GIT_SOURCE_API_GROUP}/${GIT_SOURCE_API_VERSION}`
const GITREPO_PLURAL = 'gitrepositories'
const GITREPO_KIND = 'GitRepository'

export const gitRepository = (namespace: string): CustomObjectDefinition => {
  return {
    args: [
      GIT_SOURCE_API_GROUP,
      GIT_SOURCE_API_VERSION,
      namespace,
      GITREPO_PLURAL
    ],
    apiVersion: GIT_SOURCE_API,
    kind: GITREPO_KIND,
    namespace
  }
}
