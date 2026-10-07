'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react'
import { Button } from '@components/button'
import { Input } from '@components/input'
import { Select } from '@components/select'
import { ProductService } from '@/services/api/shared/productService'
import { ScheduleService } from '@/services/api/shared/scheduleService'
import { ProductResponseDto, ParentTotScheduleResponseDto } from '@/api'
import { formatDateTime } from '@/app/utils/dates'

// Picker only offers valid (future) group sessions — the same set shoppers can
// book. Old/expired sessions are filtered out server-side. Full sessions are still
// shown (admin may want to link one) but flagged.
const sessionLabel = (s: ParentTotScheduleResponseDto) => {
  return `${formatDateTime(s.startDateTime)} — ${s.spotsAvailable} open${s.spotsAvailable <= 0 ? ' (full)' : ''}`
}

interface ProductEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product: ProductResponseDto
}

export default function ProductEditModal({ isOpen, onClose, onSuccess, product }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    amount: product.amount,
    credits: product.credits,
    features: product.features,
    scheduleId: product.scheduleId ?? '',
  })
  const [schedules, setSchedules] = useState<ParentTotScheduleResponseDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isGroup = product.lessonType === ProductResponseDto.lessonType.GROUP
  // Form state starts from the product prop. The parent keys this modal by product id, so
  // editing a different product remounts it with fresh state.

  // Load every group session so a product's session link can be reviewed/changed.
  // A linked session is what lets shoppers actually select and pay for the class.
  useEffect(() => {
    if (!isOpen || !isGroup) return
    ScheduleService.findParentTot()
      .then(setSchedules)
      .catch(() => setSchedules([]))
  }, [isOpen, isGroup])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isGroup && !formData.scheduleId) {
      setError('Group products must stay linked to a session. Select the session this product sells.')
      return
    }

    setIsSubmitting(true)
    try {
      await ProductService.update(product.id, {
        id: product.id,
        name: formData.name,
        description: formData.description,
        amount: formData.amount,
        credits: formData.credits,
        scheduleId: isGroup ? formData.scheduleId : undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to update product. Please try again.')
      console.error('Error updating product:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-8 dark:bg-zinc-900">
            <DialogTitle className="text-lg font-medium">Edit Product</DialogTitle>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Description"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount
                </label>
                <Input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Product Amount"
                />
              </div>
              {isGroup && (
                <div>
                  <label htmlFor="scheduleId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Session
                  </label>
                  <Select
                    id="scheduleId"
                    name="scheduleId"
                    value={formData.scheduleId}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  >
                    <option value="">Select a session…</option>
                    {/* Keep the currently-linked session selectable even if it was
                        deleted/canceled and no longer appears in the list. */}
                    {product.scheduleId && !schedules.some(s => s.id === product.scheduleId) && (
                      <option value={product.scheduleId}>Currently linked session (no longer in schedule)</option>
                    )}
                    {schedules.map(schedule => (
                      <option key={schedule.id} value={schedule.id}>
                        {sessionLabel(schedule)}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-6 flex justify-end gap-x-3">
                <Button onClick={onClose} plain>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
