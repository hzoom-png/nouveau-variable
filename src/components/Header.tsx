'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes hdrFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0" style={{ display: 'inline-flex' }}>
            <Image
              src="/nv-logo-black.png"
              alt="Nouveau Variable"
              width={160}
              height={40}
              priority
              style={{ objectFit: 'contain', height: 40, width: 'auto' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="https://app.nouveauvariable.fr/auth"
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              style={{ fontFamily: 'Inter', textDecoration: 'none' }}
            >
              Se connecter
            </a>
            <a
              href="/#candidature"
              className="px-6 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition"
              style={{ fontFamily: 'Inter', textDecoration: 'none', background: '#D4AF37' }}
            >
              Candidater
            </a>
          </nav>

          {/* Burger (mobile) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 cursor-pointer z-50"
            aria-label="Menu"
          >
            <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            onClick={() => setMenuOpen(false)}
            style={{ background: 'rgba(0,0,0,0.30)', animation: 'hdrFadeIn 0.2s ease-out' }}
          />
        )}

        {/* Sidebar */}
        <nav
          className={`fixed top-0 right-0 h-screen w-72 bg-white border-l border-gray-200 z-40
                      flex flex-col transform transition-transform duration-300 md:hidden
                      ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter' }}>Menu</span>
            <button onClick={() => setMenuOpen(false)} className="flex flex-col gap-1.5 cursor-pointer" aria-label="Fermer">
              <span className="block w-5 h-0.5 bg-gray-900 rotate-45 translate-y-2" />
              <span className="block w-5 h-0.5 bg-gray-900 opacity-0" />
              <span className="block w-5 h-0.5 bg-gray-900 -rotate-45 -translate-y-2" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6" />

          <div className="px-6 py-6 border-t border-gray-200 space-y-3">
            <a
              href="https://app.nouveauvariable.fr/auth"
              className="block px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter', textDecoration: 'none' }}
            >
              Se connecter
            </a>
            <a
              href="/#candidature"
              className="block px-4 py-3 text-sm font-semibold text-white rounded-lg hover:opacity-90 text-center transition"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter', textDecoration: 'none', background: '#D4AF37' }}
            >
              Candidater
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
