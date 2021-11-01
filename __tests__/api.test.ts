import {describe, expect, it, beforeEach, afterEach} from '@jest/globals'
import nock from 'nock'
import {K8sApi} from '../src/api'

import {mockGitRepo, mockKustomization} from './mocks'

beforeEach(() => {
  nock.disableNetConnect()
})

afterEach(() => {
  nock.cleanAll()
})

describe('#createNamespacedGitRepository', () => {
  it('POST to gitrepositories API', async () => {
    const api = K8sApi()
    const scope = nock('http://localhost:8080')
      .post(
        '/apis/source.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/gitrepositories'
      )
      .reply(200)

    await api.createNamespacedGitRepository('NAME', 'NAMESPACE', mockGitRepo)

    expect(scope.done())
  })
})

describe('#deleteNamespacedGitRepository', () => {
  it('DELETE to gitrepositories API', async () => {
    const api = K8sApi()
    const scope = nock('http://localhost:8080')
      .delete(
        '/apis/source.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/gitrepositories/NAME'
      )
      .reply(200)

    await api.deleteNamespacedGitRepository('NAME', 'NAMESPACE')

    expect(scope.done())
  })
})

describe('#createNamespacedKustomization', () => {
  it('POST to kustomizations API', async () => {
    const api = K8sApi()
    const scope = nock('http://localhost:8080')
      .post(
        '/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/kustomizations'
      )
      .reply(200)

    await api.createNamespacedKustomization(
      'NAME',
      'NAMESPACE',
      mockKustomization
    )

    expect(scope.done())
  })
})

describe('#getNamespacedKustomization', () => {
  it('GET to kustomizations API', async () => {
    const api = K8sApi()
    const scope = nock('http://localhost:8080')
      .get(
        '/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/kustomizations/NAME'
      )
      .reply(200)

    await api.getNamespacedKustomization('NAME', 'NAMESPACE')

    expect(scope.done())
  })
})

describe('#deleteNamespacedKustomization', () => {
  it('DELETE to kustomizations API', async () => {
    const api = K8sApi()
    const scope = nock('http://localhost:8080')
      .delete(
        '/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/kustomizations/NAME'
      )
      .reply(200)

    await api.deleteNamespacedKustomization('NAME', 'NAMESPACE')

    expect(scope.done())
  })
})

describe('#patchNamespacedKustomization', () => {
  it('PATCH to kustomizations API', async () => {
    const patch = [
      {
        op: 'replace',
        path: '/spec/postBuild/substitute/image_tag',
        value: 'latest'
      }
    ]
    const api = K8sApi()
    const scope = nock('http://localhost:8080')
      .patch(
        '/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/kustomizations/NAME',
        patch
      )
      .reply(200)

    await api.patchNamespacedKustomization('NAME', 'NAMESPACE', patch)

    expect(scope.done())
  })
})
