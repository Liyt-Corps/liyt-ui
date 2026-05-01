"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Menu, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { initializeAuth } from "@/lib/features/auth/authSlice";

export default function Header() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Track scroll position and initialize auth
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position
    
    // Initialize auth state from storage
    dispatch(initializeAuth());

    return () => window.removeEventListener("scroll", handleScroll);
  }, [dispatch]);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/download-app", label: "Download" },
  ];



  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 md:py-6 w-full transition-all duration-300",
          isScrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center z-50 w-[140px]">
            <Image
              src="/logo.png"
              alt="LIYT"
              width={120}
              height={48}
              className="h-10 md:h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center justify-center gap-12 flex-1">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-white/80 hover:text-white text-base font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons - Right */}
          <div className="hidden md:flex items-center justify-end gap-4 w-[140px]">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E4FF2C] text-[#0a0a0a] rounded-full text-base font-bold hover:bg-[#E4FF2C]/90 transition-colors whitespace-nowrap"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 text-white text-base font-medium hover:text-[#E4FF2C] transition-colors whitespace-nowrap"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2.5 bg-[#E4FF2C] text-[#0a0a0a] rounded-full text-base font-bold hover:bg-[#E4FF2C]/90 transition-colors whitespace-nowrap"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Burger Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden z-50 p-2 text-white hover:text-[#E4FF2C] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-8 h-8" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-white/80 hover:text-[#E4FF2C] text-2xl font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col items-center gap-4 mt-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-12 py-4 bg-[#E4FF2C] rounded-full text-[#0a0a0a] text-xl font-bold hover:bg-[#E4FF2C]/90 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-12 py-4 text-white text-xl font-medium hover:text-[#E4FF2C] transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-12 py-4 bg-[#E4FF2C] rounded-full text-[#0a0a0a] text-xl font-bold hover:bg-[#E4FF2C]/90 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
