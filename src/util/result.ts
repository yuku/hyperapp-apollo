export default function result<T>(func: ((...args: any[]) => T) | undefined, ...args: any[]): T | undefined {
    return func && func(...args)
}