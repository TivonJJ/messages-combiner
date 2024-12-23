import {MessageFileWatcherOptions, startMessagesFileWatcher} from "./watcher";
import {combineMessages} from "./combiner";

export const startWatcher = (path: string, options?: Omit<MessageFileWatcherOptions, 'onChunk'>) => {
    startMessagesFileWatcher(path, {
        ...options,
        onChunk: combineMessages,
    })
};
