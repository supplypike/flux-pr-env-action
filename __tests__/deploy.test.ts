/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, expect, it, jest, beforeEach} from '@jest/globals'
import {Api, CustomObject} from '../src/api'
import {fluxDeploy, FluxDeployConfig} from '../src/deploy'
import {GitRepositorySpec} from '../src/gitrepository'
import {KustomizationSpec} from '../src/kustomization'

//jest.mock('@actions/core')

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
  let api: any

  beforeEach(async () => {
    api = {
      createNamespacedKustomization: jest.fn(),
      createNamespacedGitRepository: jest.fn()
    }
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
  let api: any

  beforeEach(async () => {
    api = {
      deleteNamespacedKustomization: jest.fn(),
      deleteNamespacedGitRepository: jest.fn()
    }
    const d = fluxDeploy(mockDeploy, api)
    await d.destroy()
  })

  it('should delete a GitRepository', () => {
    expect(api.deleteNamespacedGitRepository).toHaveBeenCalledWith(
      'mock',
      'mock-ns'
    )
  })

  it('should delete a GitRepository', () => {
    expect(api.deleteNamespacedGitRepository).toHaveBeenCalledWith(
      'mock',
      'mock-ns'
    )
  })
})

describe('#rollout', () => {
  let api: any

  beforeEach(async () => {
    api = {
      patchNamespacedKustomization: jest.fn()
    }
    const d = fluxDeploy(mockDeploy, api)
    await d.rollout()
  })

  it('should patch a Kustomization', () => {
    const patch = [
      {
        op: 'replace',
        path: '/spec/postBuild/substitute/image_tag',
        value: 'latest'
      }
    ]
    expect(api.patchNamespacedKustomization).toHaveBeenCalledWith(
      'mock',
      'mock-ns',
      patch
    )
  })
})

describe('#rolloutOrDeploy', () => {
  it('should patch a Kustomization when one exists', async () => {
    const api: any = {
      getNamespacedKustomization: jest
        .fn()
        .mockImplementation(async () => Promise.resolve(mockKustomization)),
      patchNamespacedKustomization: jest.fn()
    }
    const d = fluxDeploy(mockDeploy, api)
    await d.deployOrRollout()

    const patch = [
      {
        op: 'replace',
        path: '/spec/postBuild/substitute/image_tag',
        value: 'latest'
      }
    ]
    expect(api.getNamespacedKustomization).toHaveBeenCalledWith(
      'mock',
      'mock-ns'
    )
    expect(api.patchNamespacedKustomization).toHaveBeenCalledWith(
      'mock',
      'mock-ns',
      patch
    )
  })

  it('should create a Kustomization if it does not exist', async () => {
    const api: any = {
      getNamespacedKustomization: jest.fn(),
      createNamespacedKustomization: jest.fn(),
      createNamespacedGitRepository: jest.fn()
    }
    const d = fluxDeploy(mockDeploy, api)
    await d.deployOrRollout()

    expect(api.createNamespacedKustomization).toHaveBeenCalledWith(
      'mock',
      'mock-ns',
      mockKustomization
    )
  })
})
