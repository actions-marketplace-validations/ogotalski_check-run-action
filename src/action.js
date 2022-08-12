const core = require('@actions/core')
const exec = require('@actions/exec')
const github = require('@actions/github')
const fs = require("fs");

function getPr(event) {
    const pr = {}
    switch (event) {
        case 'pull_request':
        case 'pull_request_target': {
            const pullRequest = github.context.payload.pull_request
            pr.base = pullRequest.base.sha
            pr.head = pullRequest.head.sha
            pr.number = pullRequest.number
        }
            break
        default:
            throw `Only pull requests are supported, ${github.context.eventName} not supported.`
    }
    return pr
}

function getDuration(start, end) {
    const duration = end - start
    const hours = Math.floor(duration / 3600000)
    const minutes = Math.floor((duration - hours * 3600000) / 60000)
    const seconds = Math.floor((duration - hours * 3600000 - minutes * 60000) / 1000)
    const milliseconds = duration - hours * 3600000 - minutes * 60000 - seconds * 1000
    return (hours ? ` ${hours}h` : "") + ((hours || minutes) ? ` ${minutes}m` : "") + ((hours || minutes || seconds) ? ` ${seconds}s` : "") + ` ${milliseconds}ms`
}

async function getExecOutput(command) {
    const resp = {}
    resp.exitCode = 1
    resp.stderr = ""
    resp.stdout = ""
    const options = {}
    options.listeners = {
        stdout(data) {
            resp.stdout += data.toString()
        },
        stderr(data) {
            resp.stdout += data.toString()
            resp.stderr += data.toString()
        }
    }
    try {
        resp.exitCode = await exec.exec(`/bin/bash -c "${command.replace(/"/g, '\\\"')}"`, null, options)
    } catch (e) {
        core.error(e)
    }
    return resp
}

//split string by new line or `&`

async function execute(commands) {
    const execution = {}
    execution.exitCode = 1
    execution.results = []
    execution.start = new Date()

    for (const command of commands.split("\n").filter(c => c)) {
        core.startGroup(command)
        const result = {}
        result.start = new Date()
        let resp = await getExecOutput(command)
        result.end = new Date()
        result.command = command
        result.exitCode = resp.exitCode
        result.stderr = resp.stderr
        result.stdout = resp.stdout
        result.conclusion = resp.exitCode === 0 ? "success" : "failure"
        execution.results.push(result)
        execution.exitCode = resp.exitCode

        core.endGroup()
        if (result.exitCode !== 0) break
    }
    execution.end = new Date()
    execution.conclusion = execution.exitCode === 0 ? "success" : "failure"
    core.debug("duration: " + getDuration(execution.start, execution.end))
    core.debug("result: " + execution.exitCode)
    return execution
}


function markdownExecutionOutput(execution) {
    const header = "<h4>Output:</h4>"
    const logsSize = 60000; //65535 is maximum supported by api for output text
    let output = execution.results.map(result => result.stdout).join("\n");
    output = output.length > logsSize ? "...\n" + output.slice(-1 * logsSize) : output
    const spoiler = "```\n" + output + "\n```"
    return `<details><summary>${header}</summary>\n\n${spoiler}\n</details>\n`
}

function markdownResultHeader(result) {
    const icon = result.exitCode !== 0 ? " :x: " : " :heavy_check_mark: "
    return `<dd><kbd><b>${result.command}</b></kbd> - ${icon}<b>${result.conclusion}</b> in ${getDuration(result.start, result.end)} </dd>`

}

function markdownSummary(execution) {
    return "<dl><dh><h4> Run: </h4></dh>" + execution.results.map(result => `${markdownResultHeader(result)}`).join("\n") + "</dl>\n" + markdownExecutionOutput(execution)
}

async function updateCheck(octokit, stepNameProp, execution, output, checkId) {
    const stepName = stepNameProp ? stepNameProp : await getStepName(octokit)
    const checkName = stepName ? stepName : execution.commands
    const request = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        head_sha: getPr(github.context.eventName).head,
        name: checkName,
        status: "in_progress",
        started_at: new Date()
    };
    if (execution) {
        request.started_at = execution.start
        if (execution.end) {
            let conclusion = execution.exitCode === 0 ? "success" : "failure";

            request.conclusion = conclusion
            request.status = "completed"
            request.completed_at = execution.end
            if (output) {
                request.output = {
                    title: checkName,
                    summary: `### Result: ${conclusion}`,
                    text: output
                }
            }
        }
    }

    if (!checkId) {
        core.debug("req: " + JSON.stringify(request))
        const resp = await octokit.checks.create(request);
        core.debug("resp: " + JSON.stringify(resp))
        checkId = resp.data.id
    } else {
        request.check_run_id = checkId
        core.debug("req: " + JSON.stringify(request))
        const resp = await octokit.checks.update(request)
        core.debug("resp: " + JSON.stringify(resp))
    }
    return checkId
}

async function run() {
    try {
        const octokit = new github.getOctokit(core.getInput('token'));
        const commands = core.getInput('run')
        const continueOnFail = core.getInput('continueOnFail')
        const stepNameProp = core.getInput('name')
        core.debug("commands: " + commands)
        core.debug("continueOnFail: " + continueOnFail)
        core.debug("stepNameProp: " + stepNameProp)
        const checkId = await updateCheck(octokit, stepNameProp, null, null, null)
        const execution = await execute(commands);
        const output = markdownSummary(execution)
        core.debug("output: " + output)
        core.debug("exitCode: " + execution.exitCode)
        await updateCheck(octokit, stepNameProp, execution, output, checkId)
        if (!continueOnFail && execution.exitCode != 0)
            core.setFailed(execution.results.map(result => result.stderr).join("/n"))
        core.setOutput("conclusion", execution.conclusion)
    } catch (error) {
        core.setFailed(error)
    }
}

function fileExists(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 0
}

async function getStepName(octokit) {
    const jobName = github.context.job
    core.debug("job: " + jobName);
    core.debug("run_id: " + github.context.runId);
    const jobsResp = await octokit.actions.listJobsForWorkflowRun({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        run_id: github.context.runId,
    })

    core.debug("jobsResp: " + JSON.stringify(jobsResp))
    const job = jobsResp.data.jobs.filter(job => job.name == jobName).at(0)
    core.debug("job: " + JSON.stringify(job))
    if (!job) return null

    const step = job.steps.filter(step => step.status === "in_progress").at(0)
    core.debug("step: " + step)

    if (!step) return null
    return step.name

}

module.exports = {
    run
}
