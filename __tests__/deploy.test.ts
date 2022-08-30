import {describe, expect, it, jest, beforeEach} from '@jest/globals'
import {fluxDeploy} from '../src/deploy'
import {mockDeploy, mockGitRepo, mockKustomization} from './mocks/mocks'

jest.mock('@actions/core')

const mockName = 'hello-world-dependabot-npm-and-yarn-url-parse-1-5-10'

describe('#destroy', () => {
  let api: any

  beforeEach(async () => {
    api = {
      deleteNamespacedKustomization: jest.fn(),
      deleteNamespacedGitRepository: jest.fn(),
      deleteNamespacedHelmRelease: jest.fn()
    }
    const d = fluxDeploy(mockDeploy, api)
    await d.destroy()
  })

  it('should delete a GitRepository', () => {
    expect(api.deleteNamespacedGitRepository).toHaveBeenCalledWith(
      mockName,
      'mock-ns'
    )
  })

  it('should delete a Kustomization', () => {
    expect(api.deleteNamespacedKustomization).toHaveBeenCalledWith(
      mockName,
      'mock-ns'
    )
  })

  it('should delete a HelmRelease', () => {
    expect(api.deleteNamespacedHelmRelease).toHaveBeenCalledWith(
      mockName,
      'mock-ns'
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
      mockName,
      'mock-ns'
    )
    expect(api.patchNamespacedKustomization).toHaveBeenCalledWith(
      mockName,
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
      mockName,
      'mock-ns',
      mockKustomization
    )

    expect(api.createNamespacedGitRepository).toHaveBeenCalledWith(
      mockName,
      'mock-ns',
      mockGitRepo
    )
  })
})
