'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="shadow-sm sticky top-0 z-50" style={{ backgroundColor: 'var(--navy)' }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/ark-logo-web.png"
                alt="ARK Identity"
                width={80}
                height={21}
                className="h-5 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/about" className="text-white hover:text-gold transition">
              About
            </Link>
            <Link href="/team" className="text-white hover:text-gold transition">
              Team
            </Link>
            <Link href="/beliefs" className="text-white hover:text-gold transition">
              What We Believe
            </Link>
            <Link
              href="/giving"
              className="px-4 py-2 rounded-lg font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              Giving
            </Link>
            <Link href="/get-involved" className="text-white hover:text-gold transition">
              Get Involved
            </Link>
            <Link href="/vision-2026" className="text-white hover:text-gold transition">
              Vision 2026
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-gold focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="/about" className="block text-white hover:text-gold transition py-2">
              About
            </Link>
            <Link href="/team" className="block text-white hover:text-gold transition py-2">
              Team
            </Link>
            <Link href="/beliefs" className="block text-white hover:text-gold transition py-2">
              What We Believe
            </Link>
            <Link
              href="/giving"
              className="block px-4 py-2 rounded-lg font-semibold transition text-center"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              Giving
            </Link>
            <Link href="/get-involved" className="block text-white hover:text-gold transition py-2">
              Get Involved
            </Link>
            <Link href="/vision-2026" className="block text-white hover:text-gold transition py-2">
              Vision 2026
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
