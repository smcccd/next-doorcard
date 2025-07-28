import { Search } from "lucide-react";

<div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-800 dark:via-blue-900 dark:to-gray-900 w-screen -ml-[50vw] left-1/2 -mt-10">
  {/* Background Pattern */}
  <div
    className="absolute inset-0 opacity-10"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: "60px 60px",
    }}
  ></div>

  {/* Overlay gradient for better text readability */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

  {/* Hero Content */}
  <div className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
    <div className="text-center max-w-7xl mx-auto">
      <h1 className="text-3xl sm:text-5xl text-blue-100 mb-4 leading-relaxed font-heading tracking-wide">
        Office Hours & Contact Information
      </h1>
      <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight font-heading tracking-tight">
        Find Your Professor
      </p>
      <p className="text-blue-200 text-base sm:text-lg mb-8 font-semibold tracking-wide">
        San Mateo County Community College District
      </p>

      {/* Enhanced Info Card in Hero */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-left">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg mb-2 font-heading">
                Need to meet with a professor?
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed font-medium">
                Find their office hours, location, and contact details. Each
                faculty profile shows when they&apos;re available for student
                meetings, their office number, and how to reach them across our
                three campuses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;
