'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react'
import { Button } from '@components/button'
import { Input } from '@components/input'
import { Textarea } from '@components/textarea'
import { InstructorService } from '@/services/api/shared/instructorService'
import { FileService } from '@/services/api/shared/fileService'
import Image from 'next/image'
import { isStoredImage } from '@/app/utils/images'
import { Instructor } from '@lib/instructor'

interface InstructorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  instructor?: Instructor
}

export default function InstructorModal({ isOpen, onClose, onSuccess, instructor }: InstructorModalProps) {
  const [formData, setFormData] = useState({
    name: instructor?.name || '',
    bio: instructor?.bio || '',
    imageUrl: instructor?.imageUrl || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(instructor?.imageUrl || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (instructor) {
        await InstructorService.update(instructor.id, formData)
      } else {
        await InstructorService.create(formData)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError('Failed to create instructor. Please try again.')
      console.error('Error creating instructor:', err)
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
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const buttonText = instructor ? 'Edit Instructor' : 'Create Instructor'

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-8 dark:bg-zinc-900">
            <DialogTitle className="text-lg font-medium">{buttonText}</DialogTitle>
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
                  placeholder="Instructor Name"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  rows={4}
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
                <Button type="submit" disabled={isSubmitting || isUploading || !previewUrl}>
                  {isSubmitting ? 'Saving...' : buttonText}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
