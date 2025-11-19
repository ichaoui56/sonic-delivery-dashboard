import { getAllProductTransfers } from "@/lib/actions/admin/transfers"
import { TransfersClient } from "./transfers-client"

export async function TransfersContent() {
  const result = await getAllProductTransfers()

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{result.error}</p>
      </div>
    )
  }

  return <TransfersClient initialTransfers={result.data || []} />
}
