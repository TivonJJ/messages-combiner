import nodepath from "path";
import micromatch from "micromatch";
import fs from "fs-extra";
import _ from 'lodash';
import {unflatten} from './utils/flat'

export interface CombineOptions {
    namespace?: Record<string, string>
    dir: string
    output?: string
    mergeMode?: 'merge' | 'assign'
    unFlatten?: boolean
}

export function combineMessages(map: Record<string, object>, options: CombineOptions) {
    const {namespace = {}, output = nodepath.join(options.dir, '/messages')} = options;
    const messages: Record<string, Record<string, any>> = {};
    const files = Object.keys(map);
    files.forEach(path => {
        const locale = options.unFlatten ? unflatten(map[path]) : map[path];
        const language = nodepath.basename(path, '.json');

        if (!messages[language]) {
            messages[language] = {};
        }

        let matched = false;
        const namespaces = Object.keys(namespace);
        const merge = options.mergeMode === 'merge' ? _.merge : _.assign;
        for (const ns of namespaces) {
            const nsn = namespace[ns];
            if (micromatch.isMatch(path, ns)) {
                if (!messages[language][nsn]) {
                    messages[language][nsn] = {};
                }
                merge(messages[language][nsn], locale);
                matched = true;
                break;
            }
        }
        if (!matched) {
            merge(messages[language], locale);
        }
    });

    // Sort the keys of each language's messages
    Object.keys(messages).forEach(language => {
        const sortedMessages: Record<string, Record<string, any>> = {};
        Object.keys(messages[language]).sort().forEach(key => {
            sortedMessages[key] = messages[language][key];
        });
        messages[language] = sortedMessages;
    });

    // Write each language's messages to a separate file
    Object.keys(messages).forEach(async (language) => {
        const filePath = nodepath.normalize(nodepath.join(
            nodepath.isAbsolute(output) ? output : nodepath.join(options.dir, output),
            `${language}.json`
        ));
        await fs.mkdirp(nodepath.dirname(filePath));
        await fs.writeFile(filePath, JSON.stringify(messages[language], null, 2), 'utf-8')
    });
    return messages;
}