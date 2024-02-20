import { join } from "path";
import assert from "assert";
import { promisify } from "util";
import { existsSync } from "fs";
import cp, { spawn } from "child_process";
import { info, error, startGroup, endGroup, setFailed } from "@actions/core";

export default class Utils {
    /** global utils **/
    cwd = process.cwd();
    exec = promisify(cp.exec).bind(cp);
    
    static getCwdFromPath(path) {
        assert(path, "Path is undefined");
        return join(Utils.cwd, path);
    };
    
    static assertDirExists(path) {
        const isExists = existsSync(path);
        assert(isExists, `Directory "${path}" does not exists.`);
    };
    
    static assertFileExists(filePath) {
        const isExists = existsSync(filePath);
        assert(isExists, `File "${filePath}" does not exists.`);
    };
    
    static runCommand(command, { env = {}, options = "" }) {
        const parts = command.split(" ").filter(part => Boolean(part));
        if (!parts.length) throw new Error("Wrong command provided");
        return new Promise((resolve, reject) => {
            const args = parts.slice(1, parts.length);
            const processEnv = new Object(process.env);
            const commandEnv = Object.assign(processEnv, env);
            
            const command = spawn(parts[0], args, {
                ...options,
                env: commandEnv,
                stdio: "inherit"
            });
            
            const onExit = (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                };
            };
            
            command.on("exit", onExit);
            command.on("close", onExit);
            command.on("error", reject);
            command.on("end", () => resolve("Done ✅"));
        });
    };
    
    static async loginToHeroku({ email = "", apikey = "", cwd = Utils.cwd }) {
        startGroup("Logging into the Heroku docker registry...");
        let output;
        try {
            output = await Utils.exec(
                `echo ${apikey} | docker login --username=${email} registry.heroku.com --password-stdin`,
                { cwd }
            );
        } catch (err) {
            output = err;
        } finally {
            const { code, stdout, stderr } = output;
            if (!stdout && !stderr) {
                return setFailed(output);
            };
            
            if (stdout) info((stdout || "").trim());
            if (stderr && code) {
                setFailed((stderr || "").trim());
            } else if (stderr) {
                error((stderr || "").trim());
            };
            
            endGroup();
        };
    };
};