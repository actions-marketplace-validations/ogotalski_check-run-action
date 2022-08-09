const core = require('@actions/core')
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

async function run() {
    try {
        const octokit = new github.getOctokit(core.getInput('token'));
        const outputFile = core.getInput('outputFile')
        const jobName = github.context.job
        core.debug("job: " + jobName);
        core.debug("outputFile: " + outputFile);
        core.debug("run_id: " + github.context.runId);
        const jobsResp = await octokit.actions.listJobsForWorkflowRun({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            run_id: github.context.runId,
        })

        core.debug("jobsResp: " + JSON.stringify(jobsResp))
        const job = jobsResp.data.jobs.filter(job => job.name == jobName).at(0)
        core.debug("job: " + JSON.stringify(job))
        if (!job) return

        const currentStepIndex = job.steps.findIndex(step => step.status === "in_progress")
        core.debug("currentStepIndex: " + currentStepIndex)

        const step  = currentStepIndex > 0? job.steps.at(currentStepIndex-1) : null
        core.debug("step: " +  JSON.stringify(step))

        if (!step) return
        const output = fileExists(outputFile) ? fs.readFileSync(outputFile, 'utf8') : null
        core.debug("output: " + output)
        if (!output) {
            await octokit.checks.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                head_sha: getPr(github.context.eventName).head,
                name: step.name,
                status: step.status,
                conclusion: step.conclusion,
                started_at: step.started_at,
                completed_at: step.completed_at
            });
        } else {
            await octokit.checks.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                head_sha: getPr(github.context.eventName).head,
                name: step.name,
                status: step.status,
                conclusion: step.conclusion,
                started_at: step.started_at,
                completed_at: step.completed_at,
                output: {
                    title: step.name,
                    summary: `#### Result ${step.conclusion}`,
                    text: output
                }
            });
        }
    } catch (error) {
        core.setFailed(error)
    }
}

function fileExists(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 0
}

module.exports = {
    run
}
