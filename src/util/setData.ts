export default function setData({ id, data }: { id: string, data: any }) {
    return (state: any) => ({
        [id]: {
            ...state[id],
            ...data
        }
    })
}
