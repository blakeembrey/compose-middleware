declare module 'array-flatten' {
  interface NestedArray <T> {
    [index: number]: T | NestedArray<T>
  }

  function arrayFlatten <T> (array: NestedArray<T>): T[]

  export = arrayFlatten
}
