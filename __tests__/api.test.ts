import {describe, expect, it, beforeEach, afterEach, jest} from '@jest/globals'
import nock from 'nock'
import path from 'path'
import {K8sApi} from '../src/api'

import {mockGitRepo, mockKustomization} from './mocks/mocks'

process.env.KUBECONFIG = path.resolve(__dirname, 'mocks/kubeconfig.yml')
const NOCK_HOST = 'http://localhost:8080'

jest.mock('@actions/core')

beforeEach(() => {
  nock.disableNetConnect()
})

afterEach(() => {
  nock.cleanAll()
})

describe('#createNamespacedGitRepository', () => {
  it('POST to gitrepositories API', async () => {
    const api = K8sApi()
    const scope = nock(NOCK_HOST)
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
    const scope = nock(NOCK_HOST)
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
    const scope = nock(NOCK_HOST)
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
    const scope = nock(NOCK_HOST)
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
    const scope = nock(NOCK_HOST)
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
    const scope = nock(NOCK_HOST)
      .patch(
        '/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/NAMESPACE/kustomizations/NAME',
        patch
      )
      .reply(200)

    await api.patchNamespacedKustomization('NAME', 'NAMESPACE', patch)

    expect(scope.done())
  })
})
