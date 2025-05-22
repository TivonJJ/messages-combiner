function isBuffer(obj: any): boolean {
    return obj &&
        obj.constructor &&
        (typeof obj.constructor.isBuffer === 'function') &&
        obj.constructor.isBuffer(obj);
}

function keyIdentity(key: string): string {
    return key;
}

export function flatten(target: any, opts: Record<any, any> = {}): Record<string, any> {
    const delimiter: string = opts.delimiter || '.';
    const maxDepth: number | undefined = opts.maxDepth;
    const transformKey: (key: string) => string = opts.transformKey || keyIdentity;
    const output: Record<string, any> = {};

    function step(object: any, prev?: string, currentDepth: number = 1): void {
        Object.keys(object).forEach(function (key: string): void {
            const value: any = object[key];
            const isarray: boolean = opts.safe && Array.isArray(value);
            const type: string = Object.prototype.toString.call(value);
            const isbuffer: boolean = isBuffer(value);
            const isobject: boolean = (
                type === '[object Object]' ||
                type === '[object Array]'
            );

            const newKey: string = prev
                ? prev + delimiter + transformKey(key)
                : transformKey(key);

            if (!isarray && !isbuffer && isobject && Object.keys(value).length &&
                (!opts.maxDepth || (maxDepth && currentDepth < maxDepth))) {
                return step(value, newKey, currentDepth + 1);
            }

            output[newKey] = value;
        });
    }

    step(target);

    return output;
}

export function unflatten(target: any, opts?: any): any {
    opts = opts || {};

    const delimiter: string = opts.delimiter || '.';
    const overwrite: boolean = opts.overwrite || false;
    const transformKey: (key: string) => string = opts.transformKey || keyIdentity;
    const result: any = {};

    const isbuffer: boolean = isBuffer(target);
    if (isbuffer || Object.prototype.toString.call(target) !== '[object Object]') {
        return target;
    }

    // Safely ensure that the key is an integer.
    function getkey(key: string): string | number {
        const parsedKey: number = Number(key);

        return (
            isNaN(parsedKey) ||
            key.indexOf('.') !== -1 ||
            opts.object
        )
            ? key
            : parsedKey;
    }

    function addKeys(keyPrefix: string, recipient: Record<string, any>, target: Record<string, any>): Record<string, any> {
        return Object.keys(target).reduce(function (result: Record<string, any>, key: string): Record<string, any> {
            result[keyPrefix + delimiter + key] = target[key];
            return result;
        }, recipient);
    }

    function isEmpty(val: any): boolean | undefined {
        const type: string = Object.prototype.toString.call(val);
        const isArray: boolean = type === '[object Array]';
        const isObject: boolean = type === '[object Object]';

        if (!val) {
            return true;
        } else if (isArray) {
            return !val.length;
        } else if (isObject) {
            return !Object.keys(val).length;
        }
    }

    target = Object.keys(target).reduce(function (result: Record<string, any>, key: string): Record<string, any> {
        const type: string = Object.prototype.toString.call(target[key]);
        const isObject: boolean = (type === '[object Object]' || type === '[object Array]');
        if (!isObject || isEmpty(target[key])) {
            result[key] = target[key];
            return result;
        } else {
            return addKeys(
                key,
                result,
                flatten(target[key], opts)
            );
        }
    }, {});

    Object.keys(target).forEach(function (key: string): void {
        const split: Array<string> = key.split(delimiter).map(transformKey);
        let key1: string | number = getkey(split.shift()!);
        let key2: string | number = getkey(split[0]);
        let recipient: any = result;

        while (key2 !== undefined) {
            if (key1 === '__proto__') {
                return;
            }

            const type: string = Object.prototype.toString.call(recipient[key1]);
            const isobject: boolean = (
                type === '[object Object]' ||
                type === '[object Array]'
            );

            // Do not write over falsey, non-undefined values if overwrite is false
            if (!overwrite && !isobject && typeof recipient[key1] !== 'undefined') {
                return;
            }

            if ((overwrite && !isobject) || (!overwrite && recipient[key1] == null)) {
                recipient[key1] = (
                    typeof key2 === 'number' &&
                    !opts.object
                        ? []
                        : {}
                );
            }

            recipient = recipient[key1];
            if (split.length > 0) {
                key1 = getkey(split.shift()!);
                key2 = getkey(split[0]);
            }
        }

        // Unflatten again for 'messy objects'
        recipient[key1] = unflatten(target[key], opts);
    });

    return result;
}