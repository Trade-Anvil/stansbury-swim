'use client'

import { useEffect, useState } from 'react'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@components/dropdown'
import { Link } from '@components/link'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { IUser, IPaginatedData } from '@lesson-scheduler/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/table'
import { Pagination } from '@components/pagination'
import { UserService } from '@/services/api/shared/userService'
import { AuthenticationService } from '@/api'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

export default function UsersList({
  searchQuery = '',
  sortBy = 'name',
  phone = '',
}: {
  searchQuery?: string
  sortBy?: string
  phone?: string
}) {
  const [users, setUsers] = useState<IUser[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const router = useRouter()

  const totalPages = Math.ceil(total / limit)

  const handleImpersonate = async (userId: string) => {
    try {
      const adminUser = localStorage.getItem('user')
      localStorage.setItem('adminUser', adminUser ?? '')

      // Call the impersonation endpoint
      const response = await AuthenticationService.authenticationControllerImpersonate({ userId })
      if (response.accessToken) {
        localStorage.setItem('user', JSON.stringify(response))
        // Redirect to user's dashboard with a full page load, so the app picks up the impersonated user
        window.location.assign('/dashboard')
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error)
      // Handle error (e.g., show a notification)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await UserService.findAll(currentPage, limit, searchQuery, phone, sortBy)
      let users: IUser[] = []
      if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
        users = response.data[0] as unknown as IUser[]
      } else if (Array.isArray(response.data)) {
        users = response.data as unknown as IUser[]
      }
      // Add sorting by unused credits
      if (sortBy === 'unusedCredits') {
        users = users.slice().sort((a, b) => (b.unusedCredits ?? 0) - (a.unusedCredits ?? 0))
      } else if (sortBy === 'name') {
        users = users
          .slice()
          .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
      } else if (sortBy === 'email') {
        users = users.slice().sort((a, b) => a.email.localeCompare(b.email))
      }
      setUsers(users)
      setTotal(response.total)
    }
    fetchUsers()
  }, [currentPage, limit, searchQuery, sortBy, phone])

  // Scroll to top when changing pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Calculate indices for current page
  const startIndex = (currentPage - 1) * limit
  const endIndex = startIndex + limit
  const paginatedUsers = users.slice(0, limit) // fallback if API returns all users

  return (
    <>
      <ul className="mt-10">
        <Table className="mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Students</TableHeader>
              <TableHeader>Unused credits</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link href={`/admin/users/${user.id}`}>
                    {user.firstName} {user.lastName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.students.length}</TableCell>
                <TableCell>{user.unusedCredits}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownButton plain>
                      <EllipsisVerticalIcon />
                    </DropdownButton>
                    <DropdownMenu>
                      <DropdownItem onClick={() => handleImpersonate(user.id)}>Impersonate</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ul>
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(endIndex, total)} of {total} results
        </div>
        {totalPages > 1 && (
          <Pagination>
            <button className="px-2 py-1" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-2 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setCurrentPage(i + 1)}
                disabled={currentPage === i + 1}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </Pagination>
        )}
      </div>
    </>
  )
}
