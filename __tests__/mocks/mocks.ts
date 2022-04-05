import {FluxDeployConfig} from '../../src/deploy'
import {GitRepositorySpec} from '../../src/gitrepository'
import {KustomizationSpec} from '../../src/kustomization'

export const mockDeploy: FluxDeployConfig = {
  name: 'mock',
  namespace: 'mock-ns',
  kustomization: {
    path: './kustomization/mock',
    branch: 'dependabot-npm-and-yarn-url-parse-1-5-10'
  },
  gitRepo: {
    branch: 'dependabot/npm_and_yarn/url-parse-1.5.10',
    secretName: 'secret',
    url: 'https://github.com/supplypike/flux-pr-env-action'
  },
  imageTag: 'latest'
}

export const mockKustomization: KustomizationSpec = {
  path: './kustomization/mock',
  targetNamespace: 'mock-ns',
  sourceRef: {
    name: 'mock',
    kind: 'GitRepository'
  },
  prune: true,
  postBuild: {
    substitute: {
      image_tag: 'latest',
      branch: 'dependabot-npm-and-yarn-url-parse-1-5-10'
    }
  },
  interval: '1m0s'
}

export const mockGitRepo: GitRepositorySpec = {
  ref: {branch: 'dependabot/npm_and_yarn/url-parse-1.5.10'},
  url: 'https://github.com/supplypike/flux-pr-env-action',
  secretRef: {
    name: 'secret'
  },
  interval: '1m0s'
}

export const mockLabel = {
  id: 123,
  description: 'foo',
  default: false,
  node_id: '123',
  name: 'foo',
  url: '',
  color: ''
}

export const mockPreviewLabel = {
  id: 123,
  description: 'preview',
  default: false,
  node_id: '123',
  name: 'preview',
  url: '',
  color: ''
}
