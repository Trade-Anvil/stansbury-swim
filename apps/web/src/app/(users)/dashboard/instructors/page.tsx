import Instructors from '@components/instructors'
import Header from '../components/Header'

export const metadata = { title: 'Instructors' }

export default function InstructorsPage() {
  return (
    <div>
      <Header title="Instructors" />
      <div className="px-6">
        <Instructors />
      </div>
    </div>
  )
}
