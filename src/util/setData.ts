export default function setData({ key, data }: { key: string; data: any }) {
  return (state: any) => ({
    [key]: {
      ...state[key],
      ...data
    }
  })
}
