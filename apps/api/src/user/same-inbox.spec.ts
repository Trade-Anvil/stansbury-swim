import { sameInboxQuery } from './same-inbox'

const matches = (signUpAddress: string, storedAddress: string) => {
  const { email } = sameInboxQuery(signUpAddress)
  if (typeof email === 'string') {
    return email === storedAddress.toLowerCase()
  }
  return new RegExp(email.$regex, email.$options).test(storedAddress)
}

describe('sameInboxQuery', () => {
  it('treats dotted Gmail variants as the same inbox', () => {
    expect(matches('j.a.ne.d.o.e@gmail.com', 'janedoe@gmail.com')).toBe(true)
    expect(matches('janedoe@gmail.com', 'j.a.ne.d.o.e@gmail.com')).toBe(true)
  })

  it('ignores plus tags and the googlemail domain', () => {
    expect(matches('janedoe+swim@gmail.com', 'janedoe@googlemail.com')).toBe(true)
    expect(matches('janedoe@gmail.com', 'jane.doe+old@gmail.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(matches('JaneDoe@Gmail.com', 'janedoe@gmail.com')).toBe(true)
  })

  it('does not match a different Gmail inbox', () => {
    expect(matches('janedoe@gmail.com', 'janedoe2@gmail.com')).toBe(false)
    expect(matches('janedoe@gmail.com', 'xjanedoe@gmail.com')).toBe(false)
  })

  it('matches other providers exactly, since dots and plus tags can be real there', () => {
    expect(sameInboxQuery('J.Smith@Example.com')).toEqual({ email: 'j.smith@example.com' })
    expect(matches('j.smith@example.com', 'jsmith@example.com')).toBe(false)
  })

  it('escapes regex characters in the local part', () => {
    expect(matches('a*b@gmail.com', 'aaaab@gmail.com')).toBe(false)
    expect(matches('a*b@gmail.com', 'a*b@gmail.com')).toBe(true)
  })
})
