import nodepath from "path";
import micromatch from "micromatch";
import fs from "fs-extra";

export interface CombineOptions {
    namespace?: Record<string, string>
    dir: string
    output?: string
}

export function combineMessages(map: Record<string, object>, options: CombineOptions) {
    const {namespace = {}, output = nodepath.join(options.dir, '/messages')} = options;
    const messages: Record<string, Record<string, any>> = {};
    const files = Object.keys(map);
    files.forEach(path => {
        const locale = map[path];
        const language = nodepath.basename(path, '.json');

        if (!messages[language]) {
            messages[language] = {};
        }

        let matched = false;
        const namespaces = Object.keys(namespace);
        for (const ns of namespaces) {
            const nsn = namespace[ns];
            if (micromatch.isMatch(path, ns)) {
                if (!messages[language][nsn]) {
                    messages[language][nsn] = {};
                }
                Object.assign(messages[language][nsn], locale);
                matched = true;
                break;
            }
        }
        if (!matched) {
            Object.assign(messages[language], locale);
        }
    });

    // Sort the keys of each language's messages
    Object.keys(messages).forEach(language => {
        const sortedMessages:Record<string, Record<string, any>> = {};
        Object.keys(messages[language]).sort().forEach(key => {
            sortedMessages[key] = messages[language][key];
        });
        messages[language] = sortedMessages;
    });

    // Write each language's messages to a separate file
    Object.keys(messages).forEach(async (language) => {
        const filePath = nodepath.join(
            nodepath.isAbsolute(output) ? output : nodepath.join(options.dir, output),
            `${language}.json`
        );
        await fs.mkdirp(nodepath.dirname(filePath));
        await fs.writeFile(filePath, JSON.stringify(messages[language], null, 2), 'utf-8')
    });
    return messages;
}