import Link from "next/link";
import { NavDropdown } from "./NavDropdown";
import SMCCDLogoFresh from "./SMCCDLogoFresh";
import MobileNav from "./MobileNav";
import {
  getNavigationAuth,
  navigationItems,
  navStyles,
} from "@/lib/navigation";

export default async function Navbar() {
  const { session, userDisplay, isAdmin } = await getNavigationAuth();

  return (
    <nav className={`${navStyles.container.nav} relative`} aria-label="Primary">
      <div className={navStyles.container.wrapper}>
        <div className={`${navStyles.container.flex} h-28`}>
          {/* Logo & App Branding */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center group flex-shrink-0 transition-colors duration-200 hover:opacity-90"
              aria-label="Faculty Doorcard System - Home"
            >
              {/* SMCCD Logo */}
              <SMCCDLogoFresh
                height={52}
                animate={false}
                className="transition-colors duration-200 flex-shrink-0"
              />

              {/* App Branding - Clean separation */}
              <div className="mx-3 border-l border-gray-300 pl-3">
                <div className="text-xl font-semibold text-smccd-blue-900 dark:text-white transition-colors duration-200 group-hover:text-smccd-blue-700 dark:group-hover:text-smccd-blue-200">
                  Faculty Doorcard
                </div>
              </div>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right Side Navigation & Actions */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center space-x-1"
              aria-label="Primary navigation"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${navStyles.navLink.base} ${navStyles.navLink.desktop} ${navStyles.navLink.underlineEffect} font-semibold text-base`}
                  aria-label={item.ariaLabel}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center">
              {session ? (
                <NavDropdown userDisplay={userDisplay} isAdmin={isAdmin} />
              ) : (
                <Link
                  href="/login"
                  className={`${navStyles.loginButton.base} ${navStyles.loginButton.desktop}`}
                  aria-label="Sign in to your faculty account"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Navigation */}
            <MobileNav
              session={session}
              userDisplay={userDisplay}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
