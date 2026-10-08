'use client'

import { Divider } from '@components/divider'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@components/dropdown'
import { Link } from '@components/link'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { Instructor } from '@lib/instructor'
import { isStoredImage } from '@/app/utils/images'
import Image from 'next/image'
import { useState } from 'react'
import DeleteInstructorModal from './delete-instructor-modal'
import InstructorModal from './instructor-modal'

interface InstructorsListProps {
  instructors: Instructor[]
}

export default function InstructorsList({ instructors }: InstructorsListProps) {
  const [editingInstructor, setEditingInstructor] = useState<Instructor | undefined>(undefined)
  const [deletingInstructor, setDeletingInstructor] = useState<Instructor | undefined>(undefined)

  const handleEditClick = (instructor: Instructor) => {
    setEditingInstructor(instructor)
  }

  const handleDeleteClick = (instructor: Instructor) => {
    setDeletingInstructor(instructor)
  }

  const handleCloseEditModal = () => {
    setEditingInstructor(undefined)
  }

  const handleCloseDeleteModal = () => {
    setDeletingInstructor(undefined)
  }

  const handleSuccess = () => {
    // Refresh the page to get the updated data
    window.location.reload()
  }

  return (
    <ul className="mt-10">
      {instructors.length > 0 ? (
        instructors.map((instructor, index) => (
          <li key={instructor.id}>
            <Divider soft={index > 0} />
            <div className="flex items-center justify-between">
              <div className="flex gap-6 py-6">
                <div className="w-32 shrink-0">
                  <Link href={`/admin/instructors/${instructor.id}`} aria-hidden="true">
                    {instructor.imageUrl && (
                      <Image
                        className="h-auto w-full rounded-lg shadow-sm"
                        src={instructor.imageUrl}
                        alt=""
                        width={128}
                        height={128}
                        unoptimized={!isStoredImage(instructor.imageUrl)}
                      />
                    )}
                  </Link>
                </div>
                <div className="space-y-1.5">
                  <div className="text-base/6 font-semibold">
                    <Link href={`/admin/instructors/${instructor.id}`}>{instructor.name}</Link>
                  </div>
                  <div className="text-xs/6 text-zinc-500">{instructor.bio}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Dropdown>
                  <DropdownButton plain aria-label="More options">
                    <EllipsisVerticalIcon />
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end">
                    <DropdownItem onClick={() => handleEditClick(instructor)}>Edit</DropdownItem>
                    <DropdownItem onClick={() => handleDeleteClick(instructor)}>Delete</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </li>
        ))
      ) : (
        <li className="py-6 text-center text-sm text-zinc-500">No instructors found.</li>
      )}
      {editingInstructor && (
        <InstructorModal
          isOpen={!!editingInstructor}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
          instructor={editingInstructor}
        />
      )}
      {deletingInstructor && (
        <DeleteInstructorModal
          isOpen={!!deletingInstructor}
          onClose={handleCloseDeleteModal}
          onSuccess={handleSuccess}
          instructor={deletingInstructor}
        />
      )}
    </ul>
  )
}
