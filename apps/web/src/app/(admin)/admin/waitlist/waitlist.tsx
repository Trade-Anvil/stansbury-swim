'use client'

import { useEffect, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/table'
import { WaitlistResponseDto } from '@/api/models/WaitlistResponseDto'
import { ConfigService } from '@/services/api/shared/configService'
import { SiteConfigService } from '@/api/services/SiteConfigService'
import { WaitlistService } from '@/api/services/WaitlistService'
import { Button } from '@components/button'
import { Input, InputGroup } from '@components/input'
import { Select } from '@components/select'
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'

type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc'
type StatusFilter = 'all' | 'allowed' | 'not-allowed'
type YearFilter = 'this-year' | 'last-year' | 'all'

const currentYear = new Date().getFullYear()
const startOfThisYear = new Date(currentYear, 0, 1)

export default function WaitlistList() {
  const [waitlist, setWaitlist] = useState<WaitlistResponseDto[]>([])
  const [waitlistEnabled, setWaitlistEnabled] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<YearFilter>('this-year')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [bulkArchiving, setBulkArchiving] = useState(false)

  const fetchConfig = () => ConfigService.findOne().then(response => setWaitlistEnabled(response.waitlistEnabled))

  const fetchWaitlist = () => WaitlistService.waitlistControllerFindAll(showArchived).then(setWaitlist)

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    fetchWaitlist()
  }, [showArchived])

  const toggleWaitlist = async () => {
    await SiteConfigService.siteConfigControllerToggleWaitlist()
    await fetchConfig()
  }

  const allowPurchase = async (userId: string) => {
    await WaitlistService.waitlistControllerUpdate(userId)
    fetchWaitlist()
  }

  const archive = async (id: string) => {
    await WaitlistService.waitlistControllerArchive(id)
    fetchWaitlist()
  }

  const unarchive = async (id: string) => {
    await WaitlistService.waitlistControllerUnarchive(id)
    fetchWaitlist()
  }

  const bulkArchive = async () => {
    const confirmed = window.confirm(
      `Archive every waitlist entry created before Jan 1, ${currentYear}? Archived entries are hidden by default but can be restored.`,
    )
    if (!confirmed) return
    setBulkArchiving(true)
    try {
      const result = await WaitlistService.waitlistControllerBulkArchive({
        before: startOfThisYear.toISOString(),
      })
      window.alert(`Archived ${result.archivedCount} waitlist ${result.archivedCount === 1 ? 'entry' : 'entries'}.`)
      fetchWaitlist()
    } finally {
      setBulkArchiving(false)
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return waitlist
      .filter(entry => {
        if (term) {
          const name = `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.toLowerCase()
          const email = (entry.email ?? '').toLowerCase()
          if (!name.includes(term) && !email.includes(term)) return false
        }
        if (statusFilter === 'allowed' && !entry.allowed) return false
        if (statusFilter === 'not-allowed' && entry.allowed) return false
        if (yearFilter !== 'all') {
          const created = entry.createdAt ? new Date(entry.createdAt) : null
          if (!created) return false
          const createdYear = created.getFullYear()
          if (yearFilter === 'this-year' && createdYear !== currentYear) return false
          if (yearFilter === 'last-year' && createdYear !== currentYear - 1) return false
        }
        return true
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case 'name-asc':
            return (a.firstName ?? '').localeCompare(b.firstName ?? '')
          case 'name-desc':
            return (b.firstName ?? '').localeCompare(a.firstName ?? '')
        }
      })
  }, [waitlist, search, yearFilter, statusFilter, sortKey])

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm">Waitlist is currently {waitlistEnabled ? 'enabled' : 'disabled'}</span>
          <Button onClick={toggleWaitlist} outline>
            {waitlistEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show archived
          </label>
          <Button color="zinc" onClick={bulkArchive} disabled={bulkArchiving}>
            {bulkArchiving ? 'Archiving…' : `Archive entries before Jan 1, ${currentYear}`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <InputGroup>
            <MagnifyingGlassIcon />
            <Input
              name="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
        <Select value={yearFilter} onChange={e => setYearFilter(e.target.value as YearFilter)}>
          <option value="this-year">Joined this year ({currentYear})</option>
          <option value="last-year">Joined last year ({currentYear - 1})</option>
          <option value="all">All years</option>
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="allowed">Allowed</option>
          <option value="not-allowed">Not allowed</option>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          {showArchived ? ' (including archived)' : ''}
        </p>
        <Select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="w-auto min-w-[180px]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </Select>
      </div>

      <Table className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Phone</TableHeader>
            <TableHeader>Allowed</TableHeader>
            <TableHeader>Allowed on</TableHeader>
            <TableHeader>Created at</TableHeader>
            {showArchived ? <TableHeader>Archived</TableHeader> : null}
            <TableHeader>
              <span className="sr-only">Actions</span>
            </TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(entry => {
            const isArchived = !!entry.archivedAt
            return (
              <TableRow key={entry.id} title={`User #${entry.id}`} href={`/admin/users/${entry.id}`}>
                <TableCell>
                  {entry.firstName} {entry.lastName}
                </TableCell>
                <TableCell>{entry.email}</TableCell>
                <TableCell>{entry.phone}</TableCell>
                <TableCell>{entry.allowed ? 'Yes' : 'No'}</TableCell>
                <TableCell>{entry.allowedOn ? new Date(entry.allowedOn).toLocaleDateString() : ''}</TableCell>
                <TableCell>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}</TableCell>
                {showArchived ? (
                  <TableCell>{entry.archivedAt ? new Date(entry.archivedAt).toLocaleDateString() : ''}</TableCell>
                ) : null}
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button disabled={entry.allowed} onClick={() => allowPurchase(entry.userId)} outline>
                      {entry.allowed ? 'Allowed' : 'Allow purchase'}
                    </Button>
                    {isArchived ? (
                      <Button onClick={() => unarchive(entry.id)} outline>
                        Restore
                      </Button>
                    ) : (
                      <Button onClick={() => archive(entry.id)} outline>
                        Archive
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">No waitlist entries match your filters.</p>
      ) : null}
    </div>
  )
}
