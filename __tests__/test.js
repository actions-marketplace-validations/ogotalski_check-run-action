const core = require("@actions/core");
const github = require("@actions/github");
const action = require("../src/action");
const exec = require("@actions/exec");
jest.mock("@actions/core");
jest.mock("@actions/github");
jest.mock("@actions/exec");

describe("Test", function () {
    let createCheck

    function getInput(key) {
        switch (key) {
            case "token":
                return null
            case "run":
                return "ls"
            case "continueOnFail":
                return "true"
        }
    }

    beforeEach(() => {
        console.log("mocking")
        createCheck = jest.fn();
        core.getInput = jest.fn(getInput);
        github.getOctokit = jest.fn(() => {

            return {
                checks: {
                    create: createCheck,
                },
                actions: {
                    listJobsForWorkflowRun: jest.fn(() => {
                            return listJobsForWorkflowRunResponse
                        }
                    )
                }
            };
        });
        core.setFailed = jest.fn((c) => {
            console.log(c);
            fail(c);
        });
        exec.exec = jest.fn((c, a, o) => {
            o.listeners.stdout({toString: jest.fn(() => "stdout")})
            o.listeners.stderr({toString: jest.fn(() => "stderr")})
            return 0
        })
    })

    const listJobsForWorkflowRunResponse = JSON.parse(
        "{\n" +
        "   \"data\":{\n" +
        "      \"total_count\":1,\n" +
        "      \"jobs\":[\n" +
        "         {\n" +
        "            \"id\":7732094361,\n" +
        "            \"run_id\":2820133003,\n" +
        "            \"run_url\":\"https://api.github.com/repos/ogotalski/test/actions/runs/2820133003\",\n" +
        "            \"run_attempt\":1,\n" +
        "            \"node_id\":\"CR_kwDOEqMRgc8AAAABzN5lmQ\",\n" +
        "            \"head_sha\":\"ea3481da9acf7534ccec00ac6b780bfb0108840c\",\n" +
        "            \"url\":\"https://api.github.com/repos/ogotalski/test/actions/jobs/7732094361\",\n" +
        "            \"html_url\":\"https://github.com/ogotalski/test/runs/7732094361?check_suite_focus=true\",\n" +
        "            \"status\":\"in_progress\",\n" +
        "            \"conclusion\":null,\n" +
        "            \"started_at\":\"2022-08-08T18:33:58Z\",\n" +
        "            \"completed_at\":null,\n" +
        "            \"name\":\"build\",\n" +
        "            \"steps\":[\n" +
        "               {\n" +
        "                  \"name\":\"Set up job\",\n" +
        "                  \"status\":\"completed\",\n" +
        "                  \"conclusion\":\"success\",\n" +
        "                  \"number\":1,\n" +
        "                  \"started_at\":\"2022-08-08T18:33:58.000Z\",\n" +
        "                  \"completed_at\":\"2022-08-08T18:34:02.000Z\"\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"Run actions/checkout@v2\",\n" +
        "                  \"status\":\"completed\",\n" +
        "                  \"conclusion\":\"success\",\n" +
        "                  \"number\":2,\n" +
        "                  \"started_at\":\"2022-08-08T18:34:02.000Z\",\n" +
        "                  \"completed_at\":\"2022-08-08T18:34:03.000Z\"\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"Set up JDK 1.8\",\n" +
        "                  \"status\":\"completed\",\n" +
        "                  \"conclusion\":\"success\",\n" +
        "                  \"number\":3,\n" +
        "                  \"started_at\":\"2022-08-08T18:34:04.000Z\",\n" +
        "                  \"completed_at\":\"2022-08-08T18:34:07.000Z\"\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"Dump steps context\",\n" +
        "                  \"status\":\"completed\",\n" +
        "                  \"conclusion\":\"success\",\n" +
        "                  \"number\":4,\n" +
        "                  \"started_at\":\"2022-08-08T18:34:07.000Z\",\n" +
        "                  \"completed_at\":\"2022-08-08T18:34:07.000Z\"\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"Test coverage report\",\n" +
        "                  \"status\":\"completed\",\n" +
        "                  \"conclusion\":\"success\",\n" +
        "                  \"number\":5,\n" +
        "                  \"started_at\":\"2022-08-08T18:34:07.000Z\",\n" +
        "                  \"completed_at\":\"2022-08-08T18:34:57.000Z\"\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"add check\",\n" +
        "                  \"status\":\"in_progress\",\n" +
        "                  \"conclusion\":null,\n" +
        "                  \"number\":6,\n" +
        "                  \"started_at\":\"2022-08-08T18:34:57.000Z\",\n" +
        "                  \"completed_at\":null\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"Post Set up JDK 1.8\",\n" +
        "                  \"status\":\"queued\",\n" +
        "                  \"conclusion\":null,\n" +
        "                  \"number\":11,\n" +
        "                  \"started_at\":null,\n" +
        "                  \"completed_at\":null\n" +
        "               },\n" +
        "               {\n" +
        "                  \"name\":\"Post Run actions/checkout@v2\",\n" +
        "                  \"status\":\"queued\",\n" +
        "                  \"conclusion\":null,\n" +
        "                  \"number\":12,\n" +
        "                  \"started_at\":null,\n" +
        "                  \"completed_at\":null\n" +
        "               }\n" +
        "            ],\n" +
        "            \"check_run_url\":\"https://api.github.com/repos/ogotalski/test/check-runs/7732094361\",\n" +
        "            \"labels\":[\n" +
        "               \"ubuntu-latest\"\n" +
        "            ],\n" +
        "            \"runner_id\":1,\n" +
        "            \"runner_name\":\"Hosted Agent\",\n" +
        "            \"runner_group_id\":2,\n" +
        "            \"runner_group_name\":\"GitHub Actions\"\n" +
        "         }\n" +
        "      ]\n" +
        "   }\n" +
        "}");

    describe("Pull Request", function () {
        const context = {
            eventName: "pull_request",
            payload: {
                pull_request: {
                    number: "1",
                    base: {
                        sha: "base",
                    },
                    head: {
                        sha: "head",
                    },
                },
            },
            repo: {
                repo: "test",
                owner: "ogotalski"
            },
            runId: "12345",
            job: "build"
        };

        it("run", async () => {
            github.context = context;

            await action.run();
            const expected = JSON.parse("{\"owner\":\"ogotalski\",\"repo\":\"test\",\"head_sha\":\"head\",\"name\":\"add check\",\"status\":\"completed\",\"conclusion\":\"success\",\"started_at\":\"2022-08-10T20:05:13.355Z\",\"completed_at\":\"2022-08-10T20:05:13.356Z\",\"output\":{\"title\":\"add check\",\"summary\":\"### Result: success\",\"text\":\"<dl><dd><details><summary><kbd><b>ls</b></kbd> -  :heavy_check_mark: <b>success</b> in  1ms </summary>\\n\\n\\n\\n```\\nstdoutstderr```\\n\\n\\n</details>\\n\\n</dd></dl>\"}}")
            let result = createCheck.mock.calls[0][0];
            result.output.text = expected.output.text
            result.started_at = expected.started_at
            result.completed_at = expected.completed_at
            expect(result)
                .toEqual(expected);
        });
    });
});
