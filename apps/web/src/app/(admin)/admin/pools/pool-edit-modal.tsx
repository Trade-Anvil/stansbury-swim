'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react'
import { Button } from '@components/button'
import { Input } from '@components/input'
import { Textarea } from '@components/textarea'
import { PoolService } from '@/services/api/shared/poolService'
import { FileService } from '@/services/api/shared/fileService'
import Image from 'next/image'
import { isStoredImage } from '@/app/utils/images'
import { PoolDto } from '@/api'

interface PoolEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  pool: PoolDto
}

export default function PoolEditModal({ isOpen, onClose, onSuccess, pool }: PoolEditModalProps) {
  const [formData, setFormData] = useState({
    name: pool.name,
    address: pool.address,
    details: pool.details,
    imageUrl: pool.imageUrl,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // State starts from the pool prop. The parent keys this modal by pool id, so editing a
  // different pool remounts it with fresh state.
  const [previewUrl, setPreviewUrl] = useState<string | null>(pool.imageUrl)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await PoolService.update(pool.id, {
        id: pool.id,
        name: formData.name,
        address: formData.address,
        details: formData.details,
        imageUrl: formData.imageUrl,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to update pool. Please try again.')
      console.error('Error updating pool:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsUploading(true)
    setError(null)

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      const data = await FileService.uploadFile(file)
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      console.error('Error uploading image:', err)
      setPreviewUrl(pool.imageUrl)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-8 dark:bg-zinc-900">
            <DialogTitle className="text-lg font-medium">Edit Pool</DialogTitle>
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
                  placeholder="Pool Name"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Address
                </label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  placeholder="Pool Address"
                />
              </div>
              <div>
                <label htmlFor="details" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Details
                </label>
                <Textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  rows={4}
                  placeholder="Pool details and description"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Image
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <Input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
                      <span className="ml-2 text-sm text-zinc-500">Uploading...</span>
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div className="mt-2">
                    <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        unoptimized={!isStoredImage(previewUrl)}
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <div className="mt-6 flex justify-end gap-x-3">
                <Button onClick={onClose} plain>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Updating...' : 'Update Pool'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
