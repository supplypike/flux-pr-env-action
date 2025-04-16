import * as core from "@actions/core";
import * as k8s from "@kubernetes/client-node";

import type { CustomObjectsApiGetNamespacedCustomObjectRequest } from "@kubernetes/client-node";
import { ActionOnInvalid } from "@kubernetes/client-node/dist/config_types";
import { type GitRepositorySpec, gitRepository } from "./gitrepository";
import { helmRelease } from "./helmrelease";
import { type KustomizationSpec, kustomization } from "./kustomization";

export interface Api {
	getNamespacedKustomization(
		name: string,
		namespace: string,
	): Promise<CustomObject<KustomizationSpec>>;
	createNamespacedKustomization(
		name: string,
		namespace: string,
		spec: KustomizationSpec,
	): Promise<void>;
	patchNamespacedKustomization(
		name: string,
		namespace: string,
		patch: K8sPatch[],
	): Promise<void>;
	deleteNamespacedKustomization(name: string, namespace: string): Promise<void>;

	createNamespacedGitRepository(
		name: string,
		namespace: string,
		spec: GitRepositorySpec,
	): Promise<void>;
	deleteNamespacedGitRepository(name: string, namespace: string): Promise<void>;
	deleteNamespacedHelmRelease(name: string, namespace: string): Promise<void>;
}

interface K8sPatch {
	op: string;
	path: string;
	value: string | object;
}

interface K8sCondition {
	lastTransitionTime: Date;
	message: string;
	reason: string;
	status: string;
	type: string;
}

interface K8sStatus {
	conditions?: K8sCondition[];
}

export interface CustomObject<Spec> {
	apiVersion: string;
	kind: string;
	metadata: {
		name: string;
		namespace: string;
	};
	spec: Spec;
}

export interface CustomObjectWithStatus<Spec> extends CustomObject<Spec> {
	status?: K8sStatus;
}

export type CustomObjectApiArgs = [
	group: string,
	version: string,
	namespace: string,
	kind: string,
];

export interface CustomObjectDefinition {
	group: string;
	version: string;
	plural: string;
	kind: string;
}

function namespacedCustomObjectArgs(
	name: string,
	namespace: string,
	o: CustomObjectDefinition,
): CustomObjectsApiGetNamespacedCustomObjectRequest {
	const { group, version, plural } = o;
	return { name, group, version, namespace, plural };
}

function payload<Spec>(
	name: string,
	namespace: string,
	{ group, version, kind }: CustomObjectDefinition,
	spec: Spec,
): CustomObject<Spec> {
	return {
		apiVersion: `${group}/${version}`,
		kind,
		metadata: {
			name,
			namespace,
		},
		spec,
	};
}

const debug = (
	verb: "POST" | "GET" | "PATCH" | "DELETE",
	customObject: CustomObjectDefinition,
	obj: CustomObject<unknown> | K8sPatch[] | string,
): void =>
	core.debug(`${verb} ${customObject.kind}: ${JSON.stringify(obj, null, 2)}`);

export function K8sApi(): Api {
	const kc = new k8s.KubeConfig();
	kc.loadFromDefault({
		onInvalidEntry: ActionOnInvalid.THROW,
	});

	const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

	async function getNamespacedKustomization(
		name: string,
		namespace: string,
	): Promise<CustomObject<KustomizationSpec>> {
		debug("GET", kustomization, name);
		const res = await customApi.getNamespacedCustomObject(
			namespacedCustomObjectArgs(name, namespace, kustomization),
		);

		return res.body as CustomObject<KustomizationSpec>;
	}

	async function createNamespacedKustomization(
		name: string,
		namespace: string,
		spec: KustomizationSpec,
	): Promise<void> {
		const data = payload(name, namespace, kustomization, spec);
		debug("POST", kustomization, data);
		await customApi.createNamespacedCustomObject({
			...namespacedCustomObjectArgs(name, namespace, kustomization),
			body: data,
		});
	}

	async function patchNamespacedKustomization(
		name: string,
		namespace: string,
		patch: K8sPatch[],
	): Promise<void> {
		const options = k8s.setHeaderOptions(
			"Content-Type",
			k8s.PatchStrategy.JsonPatch,
		);
		debug("PATCH", kustomization, patch);
		await customApi.patchNamespacedCustomObject(
			{
				...namespacedCustomObjectArgs(name, namespace, kustomization),
				body: patch,
			},
			options,
		);
	}

	async function deleteNamespacedKustomization(
		name: string,
		namespace: string,
	): Promise<void> {
		debug("DELETE", kustomization, name);
		await customApi.deleteNamespacedCustomObject(
			namespacedCustomObjectArgs(name, namespace, kustomization),
		);
	}

	async function createNamespacedGitRepository(
		name: string,
		namespace: string,
		spec: GitRepositorySpec,
	): Promise<void> {
		const data = payload(name, namespace, gitRepository, spec);
		debug("POST", gitRepository, data);
		await customApi.createNamespacedCustomObject({
			...namespacedCustomObjectArgs(name, namespace, gitRepository),
			body: data,
		});
	}

	async function deleteNamespacedGitRepository(
		name: string,
		namespace: string,
	): Promise<void> {
		debug("DELETE", gitRepository, name);
		await customApi.deleteNamespacedCustomObject(
			namespacedCustomObjectArgs(name, namespace, gitRepository),
		);
	}

	async function deleteNamespacedHelmRelease(
		name: string,
		namespace: string,
	): Promise<void> {
		debug("DELETE", helmRelease, name);
		await customApi.deleteNamespacedCustomObject(
			namespacedCustomObjectArgs(name, namespace, helmRelease),
		);
	}

	return {
		getNamespacedKustomization,
		createNamespacedKustomization,
		patchNamespacedKustomization,
		deleteNamespacedKustomization,

		createNamespacedGitRepository,
		deleteNamespacedGitRepository,
		deleteNamespacedHelmRelease,
	};
}
