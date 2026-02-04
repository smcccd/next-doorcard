import Link from "next/link";
import { NavDropdown } from "./NavDropdown";
import SMCCDLogoFresh from "../logos/SMCCDLogoFresh";
import MobileNav from "./MobileNav";
import {
  getNavigationAuth,
  navigationItems,
  navStyles,
} from "@/lib/navigation";

// Shared component for rendering navigation links
function NavigationLinks({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "clean" | "underline";
  className?: string;
}) {
  const linkStyles = {
    default: `${navStyles.navLink.base} ${navStyles.navLink.desktop}`,
    clean:
      "px-3 py-2 text-sm font-medium text-gray-700 hover:text-smccd-blue-900 rounded-md hover:bg-gray-50",
    underline:
      "relative py-2 text-gray-700 hover:text-smccd-blue-900 font-medium transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-smccd-blue-900 after:transition-all after:duration-200 hover:after:w-full",
  };

  return (
    <div className={className}>
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={linkStyles[variant]}
          aria-label={item.ariaLabel}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

// Shared component for auth section
function AuthSection({
  session,
  userDisplay,
  isAdmin,
  variant = "default",
}: {
  session: any;
  userDisplay: string;
  isAdmin: boolean;
  variant?: "default" | "clean";
}) {
  const buttonStyles = {
    default: `${navStyles.loginButton.base} ${navStyles.loginButton.desktop}`,
    clean:
      "bg-smccd-blue-900 hover:bg-smccd-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium",
  };

  return (
    <>
      {session ? (
        <NavDropdown userDisplay={userDisplay} isAdmin={isAdmin} />
      ) : (
        <Link
          href="/login"
          className={buttonStyles[variant]}
          prefetch={false}
          aria-label="Sign in to your faculty account"
        >
          {variant === "default" ? "Login" : "Login"}
        </Link>
      )}
    </>
  );
}

// VARIANT 1: Minimal & Clean
export async function NavbarVariant1() {
  const { session, userDisplay, isAdmin } = await getNavigationAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Text - Horizontal Professional */}
          <Link
            href="/"
            className="flex items-center group mr-8 transition-all duration-200 hover:opacity-90"
          >
            <SMCCDLogoFresh
              height={36}
              animate={false}
              className="flex-shrink-0"
            />
            <div className="ml-4 flex flex-col">
              <span className="text-xl font-semibold text-smccd-blue-900 dark:text-white">
                Faculty Doorcard
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                SMCCD
              </span>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <NavigationLinks
              variant="clean"
              className="hidden md:flex items-center space-x-1"
            />

            <div className="hidden md:flex items-center">
              <AuthSection
                session={session}
                userDisplay={userDisplay}
                isAdmin={isAdmin}
                variant="clean"
              />
            </div>

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

// VARIANT 2: Enterprise Style with Divider
export async function NavbarVariant2() {
  const { session, userDisplay, isAdmin } = await getNavigationAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          {/* Logo & Text with Divider */}
          <Link
            href="/"
            className="flex items-center group mr-8 transition-all duration-200 hover:opacity-90"
          >
            <SMCCDLogoFresh
              height={44}
              animate={false}
              className="flex-shrink-0"
            />
            <div className="mx-4 h-12 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-smccd-blue-900 dark:text-white leading-tight">
                Faculty Doorcard
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                Student Success Center
              </span>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            <NavigationLinks
              variant="clean"
              className="hidden md:flex items-center space-x-6"
            />

            <div className="hidden md:flex items-center">
              <AuthSection
                session={session}
                userDisplay={userDisplay}
                isAdmin={isAdmin}
                variant="clean"
              />
            </div>

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

// VARIANT 3: Modern University Style
export async function NavbarVariant3() {
  const { session, userDisplay, isAdmin } = await getNavigationAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b-2 border-smccd-blue-900 dark:border-smccd-blue-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Text - Sophisticated Layout */}
          <Link
            href="/"
            className="flex items-center group mr-8 transition-all duration-200"
          >
            <SMCCDLogoFresh
              height={42}
              animate={false}
              className="flex-shrink-0"
            />
            <div className="ml-5">
              <div className="text-xl font-bold text-smccd-blue-900 dark:text-white tracking-tight">
                Faculty Doorcard
              </div>
              <div className="text-xs font-medium text-smccd-blue-700 dark:text-smccd-blue-300 uppercase tracking-widest hidden sm:block">
                SMCCD Student Success
              </div>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Navigation with Underline Effect */}
          <div className="flex items-center space-x-8">
            <NavigationLinks
              variant="underline"
              className="hidden md:flex items-center space-x-8"
            />

            <div className="hidden md:flex items-center">
              <AuthSection
                session={session}
                userDisplay={userDisplay}
                isAdmin={isAdmin}
                variant="default"
              />
            </div>

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

// VARIANT 4: Ultra-Clean Corporate
export async function NavbarVariant4() {
  const { session, userDisplay, isAdmin } = await getNavigationAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Ultra-Clean Logo & Text */}
          <Link
            href="/"
            className="flex items-center group mr-8 transition-opacity duration-200 hover:opacity-80"
          >
            <SMCCDLogoFresh
              height={32}
              animate={false}
              className="flex-shrink-0"
            />
            <span className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
              Faculty Doorcard
            </span>
          </Link>

          <div className="flex-1" />

          {/* Clean Navigation */}
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition-colors duration-150"
                  aria-label={item.ariaLabel}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center">
              {session ? (
                <NavDropdown userDisplay={userDisplay} isAdmin={isAdmin} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-smccd-blue-900 hover:bg-smccd-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-smccd-blue-700 transition-colors duration-150"
                  aria-label="Sign in to your faculty account"
                >
                  Login
                </Link>
              )}
            </div>

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
