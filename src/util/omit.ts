export default function omit(source: any, ...keys: string[]): any {
    return Object.keys(source).reduce((acc, key) => {
        return keys.indexOf(key) === -1 ? { ...acc, [key]: source[key] } : acc
    }, {})
}