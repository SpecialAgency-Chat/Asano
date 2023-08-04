export type Awaitable<T> = T | Promise<T>;

export interface Document<IdType = unknown> {
  _id: IdType;
}
