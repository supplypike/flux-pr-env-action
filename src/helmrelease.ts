interface HelmReleaseSpec {
  values: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface HelmRelease {
  metadata?: {
    name: string
    namespace: string
  }
  spec: HelmReleaseSpec
}

export const helmrelease = (
  namespace: string
): [string, string, string, string] => {
  const group = 'helm.toolkit.fluxcd.io'
  const version = 'v2beta1'
  const kind = 'helmreleases'
  return [group, version, namespace, kind]
}
