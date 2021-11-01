import {describe, expect, it, jest, beforeEach} from '@jest/globals'
import {fluxDeploy} from '../src/deploy'
import {mockGitRepo, mockDeploy, mockKustomization} from './mocks'

jest.mock('@actions/core')

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
