if (require.main !== module) {
	throw new Error("This file should not be required");
}

const childProcess = require("node:child_process");
const fs = require("node:fs");

const paramFilePath = process.argv[2];

const serializedParams = fs.readFileSync(paramFilePath, "utf8");
const params = JSON.parse(serializedParams);

const cmd = params.command;
const execOptions = params.execOptions;
const pipe = params.pipe;
const stdoutFile = params.stdoutFile;
const stderrFile = params.stderrFile;

const c = childProcess.exec(cmd, execOptions, (err) => {
	if (!err) {
		process.exitCode = 0;
	} else if (err.code === undefined) {
		process.exitCode = 1;
	} else {
		process.exitCode = err.code;
	}
});

const stdoutStream = fs.createWriteStream(stdoutFile);
const stderrStream = fs.createWriteStream(stderrFile);

c.stdout.pipe(stdoutStream);
c.stderr.pipe(stderrStream);
c.stdout.pipe(process.stdout);
c.stderr.pipe(process.stderr);

if (pipe) {
	c.stdin.end(pipe);
}
