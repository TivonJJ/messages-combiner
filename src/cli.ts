#!/usr/bin/env node
import {Command} from 'commander';
import {startMessagesFileWatcher} from "./watcher";
import {combineMessages} from "./combiner";

const program = new Command();

program
    .version('0.1.0')
    .description('A CLI for starting the messages file watcher')
    .option('-p, --path <path>', 'Path to watch', './')
    .option('-o, --output <output>', 'Output directory')
    .option('-n, --namespace <namespace>', 'Namespace mapping in JSON format')
    .option('-b, --base-path <basePath>', 'Base path for the watcher')
    .option('-c, --config-file <configFile>', 'File matching regular for message file')
    .option('-m, --matcher <matcher>', '')
    .action((options) => {
        if (options.namespace) {
            options.namespace = JSON.parse(options.namespace);
        }
        startMessagesFileWatcher(options.path, {
            onChunk: combineMessages,
            ...options,
        });
    });

program.parse(process.argv);