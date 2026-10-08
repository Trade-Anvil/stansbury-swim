// The page is a client component, which can't export metadata, so the title lives here.
export const metadata = { title: 'My Profile' }

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
