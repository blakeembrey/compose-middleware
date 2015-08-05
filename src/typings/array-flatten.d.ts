declare module 'array-flatten' {
  interface MultiArray <T> {
    [index: number]: T | MultiArray<T>
  }

  function arrayFlatten <T> (array: MultiArray<T>): T[]

  export = arrayFlatten
}
