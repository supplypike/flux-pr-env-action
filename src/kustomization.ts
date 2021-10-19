interface KustomizationSpec {
    interval?: string,
    path: string,
    prune?: boolean,
    sourceRef: {
        kind: string,
        name: string,
    }
}

export interface Kustomization {
    metadata: {
        name: string,
        namespace: string,
    }
    spec: KustomizationSpec
}

export const kustomization = (namespace: string): [string, string, string, string] => {
    const group = "kustomize.toolkit.fluxcd.io"
    const version = "v1beta1"
    const kind = "Kustomization"
    return [group, version, namespace, kind]
}

