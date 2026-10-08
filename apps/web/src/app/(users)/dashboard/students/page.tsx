export const dynamic = 'force-dynamic'

import { StudentService } from '@/services/api/shared/studentService'
import { StudentResponseDto } from '@/api'
import StudentsClient from './StudentsClient'

export const metadata = { title: 'My Students' }

export default async function StudentsPage() {
  // Fetch students on the server
  let students: StudentResponseDto[] = []
  let error: string | null = null
  try {
    students = await StudentService.findMyStudents()
  } catch (err: any) {
    error = err.message || 'Failed to load students.'
  }

  return <StudentsClient students={students} error={error} />
}
