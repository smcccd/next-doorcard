// app/components/ProfessorHero.tsx

import { Search } from "lucide-react";

// A simple SVG dot pattern to use as a background mask
const DotPattern = () => (
  <svg
    className="absolute inset-0 -z-10 h-full w-full fill-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
    aria-hidden="true"
  >
    <defs>
      <pattern
        id="dots"
        width={32}
        height={32}
        patternUnits="userSpaceOnUse"
        x="50%"
        y="50%"
      >
        <circle cx={4} cy={4} r={1.5} />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

export default function ProfessorHero() {
  return (
    <section className="relative w-full bg-hero-blue isolate overflow-hidden">
      {/* The dot pattern background */}
      <DotPattern />

      <div className="mx-auto max-w-4xl px-6 py-24 text-center text-white sm:py-32 lg:px-8">
        {/* Main Heading */}
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
          Find Your Professor
        </h1>

        {/* Subheadings */}
        <p className="mt-4 font-sans text-lg leading-8 text-blue-100">
          Office Hours & Contact Information
        </p>
        <p className="mt-1 font-sans text-base text-blue-200">
          San Mateo County Community College District
        </p>

        {/* Search Box */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm">
            <div className="flex items-start space-x-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Search className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-sans text-lg font-semibold">
                  Need to meet with a professor?
                </h2>
                <p className="mt-1 font-sans text-sm text-blue-100">
                  Find their office hours, location, and contact details. Each
                  faculty profile shows when they're available for student
                  meetings, their office number, and how to reach them across
                  our three campuses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
