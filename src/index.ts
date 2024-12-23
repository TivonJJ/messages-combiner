import {Command} from 'commander';
import {MessageFileWatcherOptions, startMessagesFileWatcher} from "./watcher";
import {combineMessages} from "./combiner";

const program = new Command();

program
    .version('0.1.0')
    .description('A CLI for starting the messages file watcher')
    .requiredOption('-p, --path <path>', 'Path to watch')
    .option('-o, --output <output>', 'Output directory', 'i18n/messages')
    .option('-n, --namespace <namespace>', 'Namespace mapping in JSON format', '{"locales/**/*":"common","app/**/*":"page","components/**/*":"component"}')
    .option('-b, --base-path <basePath>', 'Base path for the watcher', 'src')
    .option('-c, --config-file <configFile>', 'Configuration file for the watcher')
    .action((options) => {
        const namespace = JSON.parse(options.namespace);
        startMessagesFileWatcher(options.path, {
            basePath: options.basePath,
            configFile: options.configFile,
            namespace,
            onChunk: combineMessages,
            output: options.output
        });
    });

program.parse(process.argv);

export const startWatcher = (path:string,options?:Omit<MessageFileWatcherOptions, 'onChunk'>) => {
    startMessagesFileWatcher(path, {
        ...options,
        onChunk: combineMessages,
    })
};

// invoke by code
// startWatcher('xxx/xxx/path_to_project', {
//     basePath:'src',
// })