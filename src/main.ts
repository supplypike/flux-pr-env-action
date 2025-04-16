import * as core from "@actions/core";
import * as github from "@actions/github";
import type { PullRequestEvent } from "@octokit/webhooks-types";

import { formatInputs, getConfig } from "./config";
import { fluxDeploy } from "./deploy";
import { handlePullRequest } from "./pullrequest";

const EVENT_PULL_REQUEST = "pull_request";

async function run(): Promise<void> {
	try {
		if (github.context.eventName !== EVENT_PULL_REQUEST) {
			return;
		}

		const payload = github.context.payload as PullRequestEvent;
		const inputs = formatInputs(payload);
		const { skipCheck, name } = inputs;
		const deploy = fluxDeploy(getConfig(inputs));

		const handleDeploy = async (): Promise<void> => deploy.deployOrRollout();
		const handleDestroy = async (): Promise<void> => deploy.destroy();

		if (skipCheck) {
			await handleDeploy();
		} else {
			await handlePullRequest(payload, handleDeploy, handleDestroy);
		}

		core.setOutput("deployName", name);
	} catch (error) {
		core.setFailed(error as Error);
	}
}

run();
