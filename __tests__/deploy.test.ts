import {describe, expect, it, jest, beforeEach} from '@jest/globals'
import {Api} from '../src/api'
import {fluxDeploy, FluxDeployConfig} from '../src/deploy'
import {GitRepositorySpec} from '../src/gitrepository'
import {KustomizationSpec} from '../src/kustomization'
import {MockApi} from './mocks/api'

jest.mock('@actions/core')

const mockDeploy: FluxDeployConfig = {
  name: 'mock',
  namespace: 'mock-ns',
  kustomization: {
    path: './kustomization/mock'
  },
  gitRepo: {
    branch: 'main',
    secretName: 'secret',
    url: 'https://github.com/supplypike/flux-pr-env-action'
  },
  imageTag: 'latest'
}

const mockKustomization: KustomizationSpec = {
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
      preview_name: 'mock'
    }
  },
  interval: '1m0s'
}

const mockGitRepo: GitRepositorySpec = {
  ref: {branch: 'main'},
  url: 'https://github.com/supplypike/flux-pr-env-action',
  secretRef: {
    name: 'secret'
  },
  interval: '1m0s'
}

describe('#deploy', () => {
  let api: Api
  beforeEach(async () => {
    api = MockApi()
    const d = fluxDeploy(mockDeploy, api)
    await d.deploy()
  })

  it('should create a Kustomization', () => {
    expect(api.createNamespacedKustomization).toHaveBeenCalledWith(
      'mock',
      'mock-ns',
      mockKustomization
    )
  })

  it('should create a GitRepository', () => {
    expect(api.createNamespacedGitRepository).toHaveBeenCalledWith(
      'mock',
      'mock-ns',
      mockGitRepo
    )
  })
})

describe('#destroy', () => {
  let api: Api
  beforeEach(async () => {
    api = MockApi()
    const d = fluxDeploy(mockDeploy, api)
    await d.destroy()
  })

  it('should delete a Kustomization', () => {
    expect(api.createNamespacedKustomization).toHaveBeenCalledWith(
      'mock',
      'mock-ns'
    )
  })

  it('should delete a GitRepository', () => {
    expect(api.createNamespacedGitRepository).toHaveBeenCalledWith(
      'mock',
      'mock-ns'
    )
  })
})
