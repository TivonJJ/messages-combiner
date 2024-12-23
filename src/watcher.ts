import chokidar, {FSWatcher} from 'chokidar';
import {CombineOptions} from "./combiner";
import nodepath from "path";
import fs from 'fs';

export type Action = 'A' | 'U' | 'D';

export function startWatch(dir: string, options: {
    onChange?: (path: string, action: Action) => void;
    onError?: (err: unknown) => void;
    matcher?: RegExp;
} = {}): FSWatcher {
    const watcher = chokidar.watch(dir, {
        awaitWriteFinish: true,
    });
    const {matcher = /locales\/.*\.json$/} = options;

    function emitChange(path: string, action: Action) {
        if (matcher.test(path)) {
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

export function startMessagesFileWatcher(path: string, {onChunk, matcher, ...options}: MessageFileWatcherOptions = {}) {
    const LocalMap: Record<string, object> = {}
    const dir = nodepath.join(path, options.basePath || '');
    let {configFile = nodepath.join(path, '.mcombiner.json')} = options;
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
    const mergeOption: CombineOptions = {...options, dir};
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