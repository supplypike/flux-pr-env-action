import {Api} from '../../src/api'
import {jest} from '@jest/globals'

export function MockApi(): Api {
  return {
    getNamespacedKustomization: jest.fn(),
    createNamespacedKustomization: jest.fn(),
    patchNamespacedKustomization: jest.fn(),
    deleteNamespacedKustomization: jest.fn(),

    createNamespacedGitRepository: jest.fn(),
    deleteNamespacedGitRepository: jest.fn()
  }
}
