'use client'

import { useState } from 'react'
import { Divider } from '@components/divider'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@components/dropdown'
import { Link } from '@components/link'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import { Pool } from '@lib/pool'
import PoolEditModal from './pool-edit-modal'
import DeletePoolModal from './delete-pool-modal'

interface PoolsListProps {
  pools: Pool[]
}

export default function PoolsList({ pools }: PoolsListProps) {
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  const [deletingPool, setDeletingPool] = useState<Pool | null>(null)

  const handleEditClick = (pool: Pool, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingPool(pool)
  }

  const handleDeleteClick = (pool: Pool, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingPool(pool)
  }

  const handleCloseEditModal = () => {
    setEditingPool(null)
  }

  const handleCloseDeleteModal = () => {
    setDeletingPool(null)
  }

  const handleSuccess = () => {
    window.location.reload()
  }

  return (
    <>
      <ul className="mt-10">
        {pools.length > 0 ? (
          pools.map((pool, index) => (
            <li key={pool.id}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div className="flex gap-6 py-6">
                  <div className="w-32 shrink-0">
                    <Link href={`/admin/pools/${pool.id}`} aria-hidden="true">
                      <img className="rounded-lg shadow-sm" src={pool.imageUrl} alt="" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      <Link href={`/admin/pools/${pool.id}`}>{pool.name}</Link>
                    </div>
                    <div className="text-xs/6 text-zinc-500">{pool.address}</div>
                    <div className="text-sm/6 text-zinc-600">{pool.details}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Dropdown>
                    <DropdownButton plain aria-label="More options">
                      <EllipsisVerticalIcon />
                    </DropdownButton>
                    <DropdownMenu anchor="bottom end">
                      <DropdownItem onClick={e => handleEditClick(pool, e)}>Edit</DropdownItem>
                      <DropdownItem onClick={e => handleDeleteClick(pool, e)}>Delete</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="py-6 text-center text-sm text-zinc-500">No pools found.</li>
        )}
      </ul>

      {editingPool && (
        <PoolEditModal
          key={editingPool.id}
          isOpen={!!editingPool}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
          pool={editingPool}
        />
      )}

      {deletingPool && (
        <DeletePoolModal
          isOpen={!!deletingPool}
          onClose={handleCloseDeleteModal}
          onSuccess={handleSuccess}
          pool={deletingPool}
        />
      )}
    </>
  )
}
