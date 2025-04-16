import { type Mocked, beforeEach, describe, expect, it, vi } from "vitest";
import type { Api } from "../src/api";
import { fluxDeploy } from "../src/deploy";
import { mockDeploy, mockGitRepo, mockKustomization } from "./mocks/mocks";

vi.mock("@actions/core");

const mockName = "hello-world-dependabot-npm-and-yarn-url-parse-1-5-10";

const mockedApi = () => ({
	deleteNamespacedKustomization: vi.fn(),
	deleteNamespacedGitRepository: vi.fn(),
	deleteNamespacedHelmRelease: vi.fn(),
	getNamespacedKustomization: vi.fn(),
	createNamespacedKustomization: vi.fn(),
	patchNamespacedKustomization: vi.fn(),
	createNamespacedGitRepository: vi.fn(),
});

describe("#destroy", () => {
	let api: Mocked<Api>;

	beforeEach(async () => {
		api = mockedApi();
		const d = fluxDeploy(mockDeploy, api);
		await d.destroy();
	});

	it("should delete a GitRepository", () => {
		expect(api.deleteNamespacedGitRepository).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
		);
	});

	it("should delete a Kustomization", () => {
		expect(api.deleteNamespacedKustomization).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
		);
	});

	it("should delete a HelmRelease", () => {
		expect(api.deleteNamespacedHelmRelease).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
		);
	});
});

describe("#rolloutOrDeploy", () => {
	let api: Mocked<Api>;

	it("should patch a Kustomization when one exists", async () => {
		api = {
			...mockedApi(),
			getNamespacedKustomization: vi
				.fn()
				.mockImplementation(async () => Promise.resolve(mockKustomization)),
		};
		const d = fluxDeploy(mockDeploy, api);
		await d.deployOrRollout();

		const patch = [
			{
				op: "replace",
				path: "/spec/postBuild/substitute/image_tag",
				value: "latest",
			},
		];
		expect(api.getNamespacedKustomization).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
		);
		expect(api.patchNamespacedKustomization).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
			patch,
		);
	});

	it("should create a Kustomization if it does not exist", async () => {
		api = mockedApi();
		const d = fluxDeploy(mockDeploy, api);
		await d.deployOrRollout();

		expect(api.createNamespacedKustomization).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
			mockKustomization,
		);

		expect(api.createNamespacedGitRepository).toHaveBeenCalledWith(
			mockName,
			"mock-ns",
			mockGitRepo,
		);
	});
});
