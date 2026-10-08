'use client'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import StudentModal from './components/student-modal'
import { Student } from '@lib/student'
import { StudentService } from '@/services/api/shared/studentService'
import React from 'react'
import Header from '../components/Header'
import { StudentResponseDto } from '@/api'

function calculateAge(birthday: string | Date): number {
  const birthDate = new Date(birthday)
  const ageDifMs = Date.now() - birthDate.getTime()
  const ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

interface StudentsClientProps {
  students: StudentResponseDto[]
  error: string | null
}

export default function StudentsClient({ students: initialStudents, error: initialError }: StudentsClientProps) {
  const [students, setStudents] = useState<StudentResponseDto[]>(initialStudents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const students = await StudentService.findMyStudents()
      setStudents(students)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (student: Student) => {
    if (student.id) {
      await StudentService.update(student.id, student)
      setStudents(prev => prev.map(s => (s.id === student.id ? student : s)) as StudentResponseDto[])
    } else {
      await StudentService.create(student)
      setStudents(prev => [...prev, { ...student } as StudentResponseDto])
    }
    setIsModalOpen(false)
    fetchStudents()
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingStudent(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (student: Student) => {
    if (student.id) {
      await StudentService.remove(student.id)
      setStudents(prev => prev.filter(s => s.id !== student.id))
    }
    setIsModalOpen(false)
    fetchStudents()
  }

  return (
    <div>
      <Header title="My Students" />
      <div className="py-10">
        <div className="px-6">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 py-10">
            <div>
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-base font-semibold leading-6 text-gray-900">Students</h2>
                  <p className="mt-2 text-sm text-gray-700">A list of all the students in your account.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                  <button
                    type="button"
                    className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={handleCreate}
                  >
                    Add student
                  </button>
                </div>
              </div>
              <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    {loading ? (
                      <p className="text-center text-sm text-gray-500">Loading students...</p>
                    ) : error ? (
                      <p role="alert" className="text-center text-sm text-red-600">
                        Error: {error}
                      </p>
                    ) : students.length > 0 ? (
                      <ul role="list" className="divide-y divide-gray-100">
                        {[...students]
                          .sort((a, b) => {
                            const aDeleted = !!a.deletedAt
                            const bDeleted = !!b.deletedAt
                            if (aDeleted === bDeleted) return 0
                            return aDeleted ? 1 : -1
                          })
                          .map(student => {
                            const studentName = student.deletedAt ? `${student.name} (Deleted)` : student.name
                            const isDeleted = !!student.deletedAt
                            return (
                              <li
                                key={student.id}
                                className={`relative flex justify-between gap-x-6 py-5 ${
                                  isDeleted ? 'cursor-default' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex min-w-0 gap-x-4">
                                  <div className="min-w-0 flex-auto">
                                    <p
                                      className={`text-sm font-semibold leading-6 ${
                                        isDeleted ? 'text-gray-500' : 'text-gray-900'
                                      }`}
                                    >
                                      {isDeleted ? (
                                        studentName
                                      ) : (
                                        <button type="button" className="text-left" onClick={() => handleEdit(student)}>
                                          <span className="absolute inset-x-0 -top-px bottom-0" />
                                          <span className="sr-only">Edit </span>
                                          {studentName}
                                        </button>
                                      )}
                                    </p>
                                    <p className="mt-1 flex text-xs leading-5 text-gray-500">
                                      <span className="truncate">{student.notes}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-x-4">
                                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                                    <p className={`text-sm leading-6 ${isDeleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                      Age {calculateAge(student.birthday)}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                      Ability: <span>{student.ability}</span>
                                    </p>
                                  </div>
                                  {student.deletedAt === null && (
                                    <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                                  )}
                                </div>
                              </li>
                            )
                          })}
                      </ul>
                    ) : (
                      <p className="text-center text-sm text-gray-500">No students found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <StudentModal
          key={editingStudent?.id ?? 'new'}
          student={editingStudent}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
