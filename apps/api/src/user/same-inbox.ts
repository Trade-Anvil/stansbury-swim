const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com']

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Builds a Mongo filter that finds any stored address delivering to the same inbox as `email`.
 *
 * Gmail ignores dots and anything after a `+`, so j.o.h.n@gmail.com, john+x@gmail.com and
 * john@googlemail.com are one mailbox. Bots use that to register the same person over and over,
 * and every sign-up mails them. Other providers treat those characters differently, so they are
 * matched exactly.
 */
export const sameInboxQuery = (email: string): { email: string | { $regex: string; $options: string } } => {
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)

  if (at < 1 || !GMAIL_DOMAINS.includes(domain)) {
    return { email: normalized }
  }

  const letters = local.split('+')[0].replace(/\./g, '').split('')
  if (letters.length === 0) {
    return { email: normalized }
  }

  const pattern = `^\\.*${letters.map(escapeRegex).join('\\.*')}\\.*(\\+[^@]*)?@(gmail|googlemail)\\.com$`
  return { email: { $regex: pattern, $options: 'i' } }
}
