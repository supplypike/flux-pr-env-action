import {CustomObjectDefinition} from './api'

export interface KustomizationSpec {
  interval?: string
  path: string
  prune?: boolean
  sourceRef: {
    kind: string
    name: string
  }
}

const KUSTOMIZE_API_GROUP = 'kustomize.toolkit.fluxcd.io'
const KUSTOMIZE_API_VERSION = 'v1beta1'
const KUSTOMIZE_API = `${KUSTOMIZE_API_GROUP}/${KUSTOMIZE_API_VERSION}`
const KUSTOMIZATION_PLURAL = 'kustomizations'
const KUSTOMIZATION_KIND = 'Kustomization'

// curl http://localhost:8001/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/flux-system/kustomizations?fieldSelector=metadata.name%3Dapps
// curl http://localhost:8001/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/flux-system/kustomizations/apps
// {"apiVersion":"kustomize.toolkit.fluxcd.io/v1beta1","kind":"Kustomization","metadata":{"annotations":{"kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"kustomize.toolkit.fluxcd.io/v1beta1\",\"kind\":\"Kustomization\",\"metadata\":{\"annotations\":{\"kustomize.toolkit.fluxcd.io/checksum\":\"96d7dbb98a4dc86c4e31d7e49fcdc8567fec6c0b\"},\"labels\":{\"kustomize.toolkit.fluxcd.io/name\":\"flux-system\",\"kustomize.toolkit.fluxcd.io/namespace\":\"flux-system\"},\"name\":\"apps\",\"namespace\":\"flux-system\"},\"spec\":{\"interval\":\"10m0s\",\"path\":\"./apps/testing\",\"prune\":true,\"sourceRef\":{\"kind\":\"GitRepository\",\"name\":\"flux-system\"},\"validation\":\"client\"}}\n","kustomize.toolkit.fluxcd.io/checksum":"96d7dbb98a4dc86c4e31d7e49fcdc8567fec6c0b","reconcile.fluxcd.io/requestedAt":"2021-10-13T11:07:00.606367-05:00"},"creationTimestamp":"2021-03-11T20:03:39Z","finalizers":["finalizers.fluxcd.io"],"generation":1,"labels":{"kustomize.toolkit.fluxcd.io/name":"flux-system","kustomize.toolkit.fluxcd.io/namespace":"flux-system"},"managedFields":[{"apiVersion":"kustomize.toolkit.fluxcd.io/v1beta1","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:annotations":{"f:reconcile.fluxcd.io/requestedAt":{}}}},"manager":"flux","operation":"Update","time":"2021-04-29T21:53:28Z"},{"apiVersion":"kustomize.toolkit.fluxcd.io/v1beta1","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:annotations":{".":{},"f:kubectl.kubernetes.io/last-applied-configuration":{},"f:kustomize.toolkit.fluxcd.io/checksum":{}},"f:finalizers":{".":{},"v:\"finalizers.fluxcd.io\"":{}},"f:labels":{".":{},"f:kustomize.toolkit.fluxcd.io/name":{},"f:kustomize.toolkit.fluxcd.io/namespace":{}}},"f:spec":{".":{},"f:force":{},"f:interval":{},"f:path":{},"f:prune":{},"f:sourceRef":{".":{},"f:kind":{},"f:name":{}},"f:validation":{}},"f:status":{".":{},"f:conditions":{},"f:lastAppliedRevision":{},"f:lastAttemptedRevision":{},"f:lastHandledReconcileAt":{},"f:observedGeneration":{},"f:snapshot":{".":{},"f:checksum":{},"f:entries":{}}}},"manager":"kustomize-controller","operation":"Update","time":"2021-08-26T13:35:06Z"}],"name":"apps","namespace":"flux-system","resourceVersion":"353080318","selfLink":"/apis/kustomize.toolkit.fluxcd.io/v1beta1/namespaces/flux-system/kustomizations/apps/status","uid":"61eb04c8-06dd-4cdd-b5b1-724003cef289"},"spec":{"force":false,"interval":"10m0s","path":"./apps/testing","prune":true,"sourceRef":{"kind":"GitRepository","name":"flux-system"},"validation":"client"},"status":{"conditions":[{"lastTransitionTime":"2021-10-20T16:10:55Z","message":"Applied revision: main/66f9dcd2718f114d9b9836597f357bbcfb9a4085","reason":"ReconciliationSucceeded","status":"True","type":"Ready"}],"lastAppliedRevision":"main/66f9dcd2718f114d9b9836597f357bbcfb9a4085","lastAttemptedRevision":"main/66f9dcd2718f114d9b9836597f357bbcfb9a4085","lastHandledReconcileAt":"2021-10-13T11:07:00.606367-05:00","observedGeneration":1,"snapshot":{"checksum":"a2453a5dcff72c8dd1ca78a5f3f84fc0a71a1f27","entries":[{"kinds":{"/v1, Kind=Namespace":"Namespace"},"namespace":""},{"kinds":{"/v1, Kind=ServiceAccount":"ServiceAccount","bitnami.com/v1alpha1, Kind=SealedSecret":"SealedSecret","kustomize.toolkit.fluxcd.io/v1beta1, Kind=Kustomization":"Kustomization","source.toolkit.fluxcd.io/v1beta1, Kind=GitRepository":"GitRepository"},"namespace":"core-test"},{"kinds":{"/v1, Kind=ServiceAccount":"ServiceAccount","bitnami.com/v1alpha1, Kind=SealedSecret":"SealedSecret","kustomize.toolkit.fluxcd.io/v1beta1, Kind=Kustomization":"Kustomization","source.toolkit.fluxcd.io/v1beta1, Kind=GitRepository":"GitRepository"},"namespace":"sre-test"}]}}}
export const kustomization = (namespace: string): CustomObjectDefinition => {
  return {
    args: [
      KUSTOMIZE_API_GROUP,
      KUSTOMIZE_API_VERSION,
      namespace,
      KUSTOMIZATION_PLURAL
    ],
    apiVersion: KUSTOMIZE_API,
    kind: KUSTOMIZATION_KIND,
    namespace
  }
}
