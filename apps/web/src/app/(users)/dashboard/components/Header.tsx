import React from 'react'

export default function Header({ title }: { title: string }) {
  return (
    <header className="pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1
          className="font-sans text-2xl/tight sm:text-3xl/tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[rgb(66,139,202)] via-sky-600 to-emerald-600 drop-shadow-md mb-2"
          style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
        >
          {title}
        </h1>
      </div>
    </header>
  )
}
