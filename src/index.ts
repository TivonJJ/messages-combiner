import { combineMessages } from "./combiner";
import {getAllMessages, MessageFileWatcherOptions, startMessagesFileWatcher} from "./watcher";

export const combineWatcher = (path: string, options?: Omit<MessageFileWatcherOptions, 'onChunk'>) => {
    startMessagesFileWatcher(path, {
        ...options,
        onChunk: combineMessages,
    })
};

export const combine = (path: string, options?: Omit<MessageFileWatcherOptions, 'onChunk'>) => {
    getAllMessages(path, {
        ...options,
        onChunk: combineMessages,
    })
};
