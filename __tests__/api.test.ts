import path from 'node:path'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { K8sApi } from '../src/api'

import { mockGitRepo, mockKustomization } from './mocks/mocks'

process.env.KUBECONFIG = path.resolve(__dirname, 'mocks/kubeconfig.yml')
// Match the host in the kubeconfig file
const NOCK_HOST = 'http://localhost:8080'
// The k8s client expects some data to be returned for serialization but we don't care
const MOCK_RES_DATA = { foo: 'bar' }

vi.mock('@actions/core')

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
        '/apis/source.toolkit.fluxcd.io/v1/namespaces/NAMESPACE/gitrepositories'
      )
      .reply(200, MOCK_RES_DATA)

    await api.createNamespacedGitRepository('NAME', 'NAMESPACE', mockGitRepo)

    expect(scope.isDone())
  })
})

describe('#deleteNamespacedGitRepository', () => {
  it('DELETE to gitrepositories API', async () => {
    const api = K8sApi()
    const scope = nock(NOCK_HOST)
      .delete(
        '/apis/source.toolkit.fluxcd.io/v1/namespaces/NAMESPACE/gitrepositories/NAME'
      )
      .reply(200, MOCK_RES_DATA)

    await api.deleteNamespacedGitRepository('NAME', 'NAMESPACE')

    expect(scope.done())
  })
})

describe('#createNamespacedKustomization', () => {
  it('POST to kustomizations API', async () => {
    const api = K8sApi()
    const scope = nock(NOCK_HOST)
      .post(
        '/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/NAMESPACE/kustomizations'
      )
      .reply(200, MOCK_RES_DATA)

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
        '/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/NAMESPACE/kustomizations/NAME'
      )
      .reply(200, MOCK_RES_DATA)

    await api.getNamespacedKustomization('NAME', 'NAMESPACE')

    expect(scope.done())
  })
})

describe('#deleteNamespacedKustomization', () => {
  it('DELETE to kustomizations API', async () => {
    const api = K8sApi()
    const scope = nock(NOCK_HOST)
      .delete(
        '/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/NAMESPACE/kustomizations/NAME'
      )
      .reply(200, MOCK_RES_DATA)

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
        '/apis/kustomize.toolkit.fluxcd.io/v1/namespaces/NAMESPACE/kustomizations/NAME',
        patch
      )
      .reply(200, MOCK_RES_DATA)

    await api.patchNamespacedKustomization('NAME', 'NAMESPACE', patch)

    expect(scope.done())
  })
})
