import {CustomObject, CustomObjectApiArgFactory} from './api'

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

export const gitRepository: CustomObjectApiArgFactory<GitRepositorySpec> = (
  name: string,
  namespace: string,
  spec: GitRepositorySpec
) => {
  const group = GIT_SOURCE_API_GROUP
  const version = GIT_SOURCE_API_VERSION
  const kind = GITREPO_PLURAL
  const payload: GitRepository = {
    apiVersion: GIT_SOURCE_API,
    kind: GITREPO_KIND,
    metadata: {
      name,
      namespace
    },
    spec
  }
  return [group, version, namespace, kind, payload]
}
