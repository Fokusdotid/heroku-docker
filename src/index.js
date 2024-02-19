import { join } from "path";
import assert from "assert";
import core, { info, getInput, setFailed } from "@actions/core";

/** Local Functions */
import Utils from "./lib/utils.js";
import Docker from "./lib/docker.js";

/** Config **/
const defaultProcessType = "web";
const defaultDockerfile = "Dockerfile";
const defaultDockerDirectory = "./";
const defaultBuildOptions = "--no-cache";
const defaultHerokuSkipRelease = false;
const missField = "Missing required field: '%field'";

try {
    const email = getInput("heroku_email", { required: true });
    const appName = getInput("heroku_app_name", { required: true });
    const apiKey = getInput("heroku_api_key", { required: true });
    const dockerFile = getInput("dockerfile_name") || defaultDockerfile;
    const dockerFileDir = getInput("dockerfile_directory") || defaultDockerDirectory;
    const buildOptions = getInput("build_options") || defaultBuildOptions;
    const processType = getInput("process_type") || defaultProcessType;
    const skipRelease = getInput("heroku_skip_release") || defaultSkipRelease;
    
    assert(email, missField.replace(/%field/g, "heroku_email"));
    assert(apiKey, missField.replace(/%field/g, "heroku_api_key"));
    assert(appName, missField.replace(/%field/g, "heroku_app_name"));
    
    /** Create cwd that will be used by all commands **/
    const cwd = Utils.getCwdFromPath(dockerFileDir);
    Utils.assertDirExists(cwd);
    const dockerFilePath = join(dockerFileDir, dockerFile);
    Utils.assertFileExists(dockerFilePath);
    
    /** Logging to heroku **/
    await Utils.loginToHeroku({ email, apikey: apiKey, cwd });
    
    /** Create interface docker config **/
    const docker = new Docker({
        cwd,
        apiKey,
        appName,
        dockerFile,
        processType,
        buildOptions
    });
    
    /** Building Image Container **/
    await docker.buildContainer();
    
    /** Pushing container images to heroku registry **/
    await docker.pushContainer();
    
    console.log("Successfully pushed!");
    
    /** Skiped release after true **/
    if (!skipRelease) {
    	/** Releasing to heroku apps **/
    	await docker.release();
    };
    
    info("Successfully deployed!");
} catch (err) {
    //console.error(err);
    setFailed("Something wrong: " + err?.message ?? err);
};