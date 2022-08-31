import {FluxDeployConfig} from '../../src/deploy'
import {GitRepositorySpec} from '../../src/gitrepository'
import {KustomizationSpec} from '../../src/kustomization'
import {FormattedInputs} from '../main'

const mockGitUrl = 'https://github.com/Codertocat/Hello-World.git'

export const mockDeploy: FluxDeployConfig = {
  name: 'hello-world-dependabot-npm-and-yarn-url-parse-1-5-10',
  namespace: 'mock-ns',
  pipeline: {
    path: './kustomization/testing-preview',
    secretName: 'secret',
    url: mockGitUrl,
    branch: 'main'
  },
  branch: 'dependabot-npm-and-yarn-url-parse-1-5-10',
  imageTag: 'latest'
}

export const mockKustomization: KustomizationSpec = {
  path: './kustomization/testing-preview',
  targetNamespace: 'mock-ns',
  sourceRef: {
    name: 'hello-world-dependabot-npm-and-yarn-url-parse-1-5-10',
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
  ref: {
    branch: 'main'
  },
  url: mockGitUrl,
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

export const mockUnformattedInputs: Record<string, string> = {
  pipelinePath: './kustomization/testing-preview',
  secretName: 'secret',
  deployTag: 'latest',
  namespace: 'mock-ns'
}

export const mockFormattedInputs: FormattedInputs = {
  branchKubeNameClean: 'dependabot-npm-and-yarn-url-parse-1-5-10',
  gitSecret: 'secret',
  pipelinePath: './kustomization/testing-preview',
  pipelineRepo: mockGitUrl,
  pipelineBranch: 'main',
  namespace: 'mock-ns',
  skipCheck: false,
  name: 'hello-world-dependabot-npm-and-yarn-url-parse-1-5-10',
  deployTag: 'latest'
}
