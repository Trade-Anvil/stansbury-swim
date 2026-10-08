export default function Loading() {
  return (
    <div role="status" className="flex min-h-[400px] items-center justify-center">
      <div
        className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"
        aria-hidden="true"
      ></div>
      <span className="sr-only">Loading</span>
    </div>
  )
}
