'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes hdrFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black text-green flex-shrink-0"
            style={{ fontFamily: 'Inter', textDecoration: 'none' }}
          >
            NV
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-12">
            <Link
              href="/about"
              className="text-sm font-medium text-gray-900 hover:text-green transition-colors"
              style={{ fontFamily: 'Inter' }}
            >
              Qui sommes-nous ?
            </Link>
            <Link
              href="/#outils"
              className="text-sm font-medium text-gray-900 hover:text-green transition-colors"
              style={{ fontFamily: 'Inter' }}
            >
              Outils
            </Link>
            <a
              href="https://app.nouveauvariable.fr/auth"
              className="text-sm font-medium text-gray-900 hover:text-green transition-colors"
              style={{ fontFamily: 'Inter', textDecoration: 'none' }}
            >
              Connexion
            </a>
            <a
              href="/#candidature"
              className="text-sm font-medium text-gray-900 hover:text-green transition-colors"
              style={{ fontFamily: 'Inter', textDecoration: 'none' }}
            >
              Candidater
            </a>
          </nav>

          {/* Burger (mobile only) */}
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

        {/* Sidebar drawer */}
        <nav
          className={`fixed top-0 right-0 h-screen w-72 bg-white border-l border-gray-200 z-40
                      flex flex-col transform transition-transform duration-300 md:hidden
                      ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter' }}>
              Menu
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex flex-col gap-1.5 cursor-pointer"
              aria-label="Fermer"
            >
              <span className="block w-5 h-0.5 bg-gray-900 rotate-45 translate-y-2" />
              <span className="block w-5 h-0.5 bg-gray-900 opacity-0" />
              <span className="block w-5 h-0.5 bg-gray-900 -rotate-45 -translate-y-2" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <Link
              href="/about"
              className="block text-base font-medium text-gray-900 hover:text-green transition"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter' }}
            >
              Qui sommes-nous ?
            </Link>
            <Link
              href="/#outils"
              className="block text-base font-medium text-gray-900 hover:text-green transition"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter' }}
            >
              Outils
            </Link>
          </div>

          <div className="px-6 py-6 border-t border-gray-200 space-y-3">
            <a
              href="https://app.nouveauvariable.fr/auth"
              className="block w-full px-4 py-3 text-sm font-medium text-gray-900 hover:text-green transition text-center"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter', textDecoration: 'none' }}
            >
              Connexion
            </a>
            <a
              href="/#candidature"
              className="block w-full px-4 py-3 text-sm font-medium text-gray-900 hover:text-green transition text-center"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter', textDecoration: 'none' }}
            >
              Candidater
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
