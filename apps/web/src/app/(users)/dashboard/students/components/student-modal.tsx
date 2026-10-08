import React from 'react'
import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Student } from '@lib/student'

interface StudentModalProps {
  student: Student | null
  onClose: () => void
  onSave: (student: Student) => void
  onDelete: (student: Student) => void
}

export default function StudentModal({ student, onClose, onSave, onDelete }: StudentModalProps) {
  // The parent keys this modal by student, so a different student remounts it with fresh state.
  const [formState, setFormState] = useState<Student>(() =>
    student
      ? // The date input needs the birthday as YYYY-MM-DD
        { ...student, birthday: student.birthday ? student.birthday.split('T')[0] : student.birthday }
      : { id: '', name: '', ability: '', notes: '', birthday: '' },
  )

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    onSave(formState)
  }

  const handleDelete = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    onDelete(formState)
  }

  // The parent mounts this only while it is open. Headless UI's Dialog traps focus, closes on Escape and on a
  // backdrop click, and hands focus back to whatever opened it.
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-4 sm:p-0">
          <DialogPanel className="relative w-full overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:max-w-lg">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button type="button" className="text-gray-500 hover:text-gray-700" onClick={onClose}>
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                {student ? 'Edit Student' : 'Add Student'}
              </DialogTitle>
              <div className="mt-4">
                <label htmlFor="student-name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="student-name"
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="student-ability" className="block text-sm font-medium text-gray-700">
                  Ability
                </label>
                <input
                  id="student-ability"
                  type="text"
                  name="ability"
                  value={formState.ability}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="student-notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <input
                  id="student-notes"
                  name="notes"
                  value={formState.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="student-birthday" className="block text-sm font-medium text-gray-700">
                  Birthday
                </label>
                <input
                  id="student-birthday"
                  type="date"
                  name="birthday"
                  value={formState.birthday}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>

              {student && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
