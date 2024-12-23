# Messages Combiner
`Messages Combiner` is a library designed to facilitate the combination and organization of localization message files. It provides a CLI tool and programmatic API to watch for changes in message files, combine them based on specified namespaces, and output the combined messages into separate files for each language.

### Key Features:
- **Namespace Mapping**: Define custom namespaces to organize your message files.
- **File Watching**: Automatically watch for changes in your message files and update the combined output accordingly.
- **Configurable Output**: Specify the output directory for the combined message files.
- **CLI and Programmatic API**: Use the provided CLI tool for quick setup or integrate the library programmatically into your project.

### How It Works:
1. **Watch for Changes**: The library uses `chokidar` to watch for changes in the specified directory.
2. **Combine Messages**: When a change is detected, the library reads the message files, applies namespace mappings, and combines the messages.
3. **Output Combined Messages**: The combined messages are written to separate files for each language in the specified output directory.

## Usage

#### Example 1: Execute via CLI

```bash
npx messages-combiner -p /path/to/your/project -o /path/to/output
```
For more options, please refer to the Options description below.

#### Example 2: Execute via Programmatic API
```ts
import { startWatcher } from 'messages-combiner';

startWatcher('/path/to/your/project', {
    basePath:'src',
    output:'/path/to/output',
    namespace:{
        '/locales/**/*':'common',
        '/app/**/*':'page',
        '/components/**/*':'component',
    },
    // you can also use config file to define options, The default is mcombiner.json relative your path argument
    configFile:'pathto/my_mcombiner.json',
});
```

## Options

### Options:

- **-p, --path <path>**: Path to watch. This is a required option that specifies the directory where your message files are located.
- **-o, --output <output>**: Output directory. This optional parameter specifies the directory where the combined message files will be saved. Default is `i18n/messages`.
- **-n, --namespace <namespace>**: Namespace mapping in JSON format. This optional parameter allows you to define custom namespaces to organize your message files. Default is `{"locales/**/*":"common","app/**/*":"page","components/**/*":"component"}`.
- **-b, --base-path <basePath>**: Base path for the watcher. This optional parameter specifies the base path for the watcher. Default is `src`.
- **-c, --config-file <configFile>**: Configuration file for the watcher. This optional parameter allows you to specify a configuration file that contains the options for the watcher.

You can also use a configuration file to define the options. The configuration file is a JSON file that contains the options for the watcher. The configuration file is located in the root directory of your project. The configuration file is named `.mcombiner.json`.

### Configuration File

The configuration file is a JSON file that contains the options for the watcher. The configuration file is located in the root directory of your project. The configuration file is named `.mcombiner.json`.

```json
{
    "basePath":"src",
    "output":"i18n/messages",
    "namespace":{
        "/locales/**/*":"common",
        "/app/**/*":"page",
        "/components/**/*":"component"
    }
}
```