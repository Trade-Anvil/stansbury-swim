import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { format } from 'date-fns'
import { MeService } from '@/services/api/shared/meService'
import { useUser } from '@contexts/user-context'

interface WaiverModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WaiverModal({ isOpen, onClose }: WaiverModalProps) {
  const [signature, setSignature] = useState('')
  const [error, setError] = useState<string | null>(null)
  const currentDate = new Date()
  const { user } = useUser()
  const placeholder = user ? user.firstName + ' ' + user.lastName : ''

  const handleSubmit = async () => {
    setError(null)
    if (!signature.trim()) {
      setError('Please enter your signature')
      return
    }
    if (!user) {
      setError('User not found')
      return
    }

    try {
      const signatureWithoutSpaces = signature.trim().toLowerCase().replace(/\s+/g, '')
      const userName = (user.firstName + ' ' + user.lastName).toLowerCase().replace(/\s+/g, '')

      if (signatureWithoutSpaces !== userName) {
        setError('Signature does not match')
        return
      }

      // Use MeService.updateWaiver for submitting the waiver
      const response = await MeService.updateWaiver({
        signedWaiver: true,
        waiverSignature: signature,
        waiverSignatureDate: currentDate.toISOString(),
      })

      if (response.signedWaiver) {
        onClose()
      } else {
        setError('Failed to submit waiver')
      }
    } catch (error) {
      setError('An error occurred while submitting the waiver')
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full max-h-[90vh] bg-white rounded-lg flex flex-col">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold mb-4">
              Stansbury Swim Contract, Liability Release and Consent Form
            </Dialog.Title>
          </div>

          <div className="flex flex-col flex-1 min-h-0 px-6">
            <div className="h-[50vh] overflow-auto mb-4">
              <iframe src="/stansbury-swim-liability-release.pdf" className="w-full h-full" title="Waiver Document" />
            </div>

            <div className="space-y-4 pb-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Signature</label>
                  <input
                    type="text"
                    value={signature}
                    onChange={e => {
                      setSignature(e.target.value)
                      setError(null)
                    }}
                    placeholder={placeholder}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="text"
                    value={format(currentDate, 'PPP')}
                    disabled
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={onClose}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!signature.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
