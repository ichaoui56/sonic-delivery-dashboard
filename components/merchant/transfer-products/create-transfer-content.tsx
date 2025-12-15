import { getMerchantProductsForTransfer } from "@/lib/actions/product-transfer-actions"
import { CreateTransferClient } from "./create-transfer-client"

export async function CreateTransferContent() {
  const result = await getMerchantProductsForTransfer()
  const products = result.success && result.data ? result.data : []

  return <CreateTransferClient initialProducts={products} />
}
