import React from 'react'
import { useState } from 'react'
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
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{student ? 'Edit Student' : 'Add Student'}</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Ability</label>
              <input
                type="text"
                name="ability"
                value={formState.ability}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                name="notes"
                value={formState.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Birthday</label>
              <input
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
        </div>
      </div>
    </div>
  )
}
