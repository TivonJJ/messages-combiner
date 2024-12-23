import chokidar, {FSWatcher} from 'chokidar';
import {CombineOptions} from "./combiner";
import nodepath from "path";
import fs from 'fs';

export type Action = 'A' | 'U' | 'D';

export function startWatch(dir: string, options: {
    matcher: RegExp;
    onChange?: (path: string, action: Action) => void;
    onError?: (err: unknown) => void;
}): FSWatcher {
    const watcher = chokidar.watch(dir, {
        awaitWriteFinish: true,
    });

    function emitChange(path: string, action: Action) {
        if (options.matcher.test(path)) {
            options.onChange?.(path, action);
        }
    }

    watcher.on('add', (path) => {
        emitChange(path, 'A');
    })
    watcher.on('change', (path) => {
        emitChange(path, 'U');
    })
    watcher.on('unlink', (path) => {
        emitChange(path, 'D');
    })
    watcher.on('error', (err) => {
        options.onError?.(err);
    })
    return watcher;
}

export interface MessageFileWatcherOptions {
    namespace?: Record<string, string>
    onChunk?: (map: Record<string, object>, action: CombineOptions) => void;
    basePath?: string
    output?: string
    configFile?: string
    matcher?: RegExp
}

function getOptions(path: string, options: MessageFileWatcherOptions = {}): MessageFileWatcherOptions & {
    matcher: RegExp;
    dir: string;
} {
    let {configFile = nodepath.join(path, '.mcombiner.json'), matcher = /locales\/.*\.json$/} = options;
    if (!nodepath.isAbsolute(configFile)) {
        configFile = nodepath.join(path, configFile);
    }
    if (configFile) {
        try {
            const configContent = fs.readFileSync(configFile, 'utf-8');
            const config = JSON.parse(configContent);
            options = {...config, ...options};
        } catch (err) {
            console.error(`Failed to read or parse config file: ${options.configFile}`, err);
        }
    }
    const dir = nodepath.join(path, options.basePath || '');
    return {matcher, ...options, dir};
}

export function startMessagesFileWatcher(path: string, options: MessageFileWatcherOptions = {}) {
    const LocalMap: Record<string, object> = {}
    const {onChunk, matcher, ...mergeOption} = getOptions(path, options);
    const {dir} = mergeOption;
    console.log('Watch messages dir:', dir);
    startWatch(dir, {
        matcher,
        onChange: (path, action) => {
            const relativePath = nodepath.join('/', nodepath.relative(dir, path));
            // console.log(`${action} > ${relativePath}`)
            if (['A', 'U'].includes(action)) {
                LocalMap[relativePath] = loadMessages(path);
            } else if (action === 'D') {
                delete LocalMap[relativePath];
            }
            onChunk?.(LocalMap, mergeOption)
        }
    })
}

export function getAllMessages(path: string, options: MessageFileWatcherOptions = {}){
    const LocalMap: Record<string, object> = {}
    const {onChunk, matcher, ...mergeOption} = getOptions(path, options);
    const {dir} = mergeOption;
    console.log('Get messages from dir:', dir);
    function eachDirs(path:string){
        const files = fs.readdirSync(path, { withFileTypes: true });
        files.forEach(file => {
            if (file.isDirectory()) {
                const subDir = nodepath.join(path, file.name);
                eachDirs(subDir);
            } else {
                const filePath = nodepath.join(path, file.name);
                const relativePath = nodepath.join('/', nodepath.relative(dir, filePath));
                if (matcher.test(relativePath)) {
                    LocalMap[nodepath.join('/', nodepath.relative(path, relativePath))] = loadMessages(filePath);
                }
            }
        });
    }
    eachDirs(dir);
    onChunk?.(LocalMap, mergeOption);
    return LocalMap;
}

function loadMessages(path: string) {
    const json = fs.readFileSync(path, 'utf-8');
    let content = {};
    try {
        content = JSON.parse(json);
    } catch (err) {
        console.error(err);
    }
    return content;
}