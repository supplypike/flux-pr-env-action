interface GitRepositorySpec {
  interval?: string
  ref: {
    branch: string
  }
  url: string
  secretRef: {
    name: string
  }
}

export interface GitRepository {
  metadata: {
    name: string
    namespace: string
  }
  spec: GitRepositorySpec
}

export const gitRepository = (
  namespace: string
): [string, string, string, string] => {
  const group = 'source.toolkit.fluxcd.io'
  const version = 'v1beta1'
  const kind = 'gitrepositories'
  return [group, version, namespace, kind]
}
