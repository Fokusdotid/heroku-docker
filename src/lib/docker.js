import {
    info,
    setFailed,
    endGroup,
    startGroup
} from "@actions/core";
import Utils from "./utils.js";

export default class Docker {
    constructor(obj = {}) {
        this.cwd = obj.cwd;
        this.apiKey = obj.apiKey;
        this.appName = obj.appName;
        this.dockerFile = obj.dockerFile;
        this.processType = obj.processType;
        this.buildOptions = obj.buildOptions;
    };

    async buildContainer() {
        startGroup("Building docker container...");
        try {
            const result = await Utils.runCommand(
                `docker build --file ${this.dockerFile} ${this.buildOptions} ` +
                    `--tag registry.heroku.com/${this.appName}/${this.processType} "."`,
                { options: { cwd: this.cwd } }
            );

            info(result);
            info("Successfully to build docker container.");
            console.log("Success build docker container");
        } catch (err) {
            console.error("Build failed:", err);
            setFailed("Faild to build docker container:", err);
        };

        endGroup();
    };
    
    async pushContainer() {
        startGroup("Pushing container to heroku registry...");
        try {
            const result = await Utils.runCommand(
                `docker push registry.heroku.com/${this.appName}/${this.processType}`,
                {
                    env: { HEROKU_API_KEY: this.apiKey },
                    options: { cwd: this.cwd }
                }
            );

            info(result);
            info("Successfully to pushing container.");
            console.log("Success pushing container.");
        } catch (err) {
            setFailed("Failed to push container to heroku:", err);
        };

        endGroup();
    };
    
    async release() {
        startGroup("Releasing container to heroku...");
        try {
            const result = await Utils.runCommand(
                `heroku container:release ${this.processType} --app ${this.appName}`,
                {
                    env: { HEROKU_API_KEY: this.apiKey },
                    options: { cwd: this.cwd }
                }
            );
            
            info(result);
            info("Successfully to release container to heroku.");
            console.log("Success release container.");
        } catch (err) {
            setFailed("Failed to release container to heroku:", err);
        };
        
        endGroup();
    };
};