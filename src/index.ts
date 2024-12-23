import {Command} from 'commander';
import {MessageFileWatcherOptions, startMessagesFileWatcher} from "./watcher";
import {combineMessages} from "./combiner";

const program = new Command();

program
    .version('0.1.0')
    .description('A CLI for starting the messages file watcher')
    .requiredOption('-p, --path <path>', 'Path to watch')
    .option('-o, --output <output>', 'Output directory')
    .option('-n, --namespace <namespace>', 'Namespace mapping in JSON format')
    .option('-b, --base-path <basePath>', 'Base path for the watcher')
    .option('-c, --config-file <configFile>', 'File matching regular for message file')
    .option('-m, --matcher <matcher>', '')
    .action((options) => {
        const namespace = JSON.parse(options.namespace);
        startMessagesFileWatcher(options.path, {
            basePath: options.basePath,
            configFile: options.configFile,
            namespace,
            onChunk: combineMessages,
            output: options.output,
            matcher: options.matcher,
        });
    });

program.parse(process.argv);

export const startWatcher = (path: string, options?: Omit<MessageFileWatcherOptions, 'onChunk'>) => {
    startMessagesFileWatcher(path, {
        ...options,
        onChunk: combineMessages,
    })
};

// invoke by code
// startWatcher('xxx/xxx/path_to_project', {
//     basePath:'src',
// })