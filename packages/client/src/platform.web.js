import { IdbBlockStore } from 'ipfs-car/blockstore/idb'

export const fetch = globalThis.fetch
export const Request = globalThis.Request
export const Response = globalThis.Response
export const Blob = globalThis.Blob
export const File = globalThis.File
export const Blockstore = IdbBlockStore
