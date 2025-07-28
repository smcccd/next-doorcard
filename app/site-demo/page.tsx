export default function SiteDemoPage() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Site Index Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Click on any letter in the Site Index above to jump to that section
        </p>
      </div>

      {/* Create demo sections for each letter */}
      {Array.from({ length: 26 }, (_, i) => {
        const letter = String.fromCharCode(65 + i); // A-Z
        return (
          <section
            key={letter}
            id={`section-${letter.toLowerCase()}`}
            className="scroll-mt-32 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Section {letter}
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300">
                This is a sample section for letter <strong>{letter}</strong>.
                In a real implementation, this could contain:
              </p>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Academic programs starting with "{letter}"</li>
                <li>• Departments beginning with "{letter}"</li>
                <li>• Faculty and staff directory for "{letter}"</li>
                <li>• Resources and services starting with "{letter}"</li>
              </ul>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                The Site Index provides quick navigation to help users find
                content alphabetically, similar to the legacy SMCCD website
                structure.
              </p>
            </div>
          </section>
        );
      })}

      <div className="text-center mt-16 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Modern Implementation Features
        </h3>
        <ul className="text-blue-800 dark:text-blue-200 space-y-1">
          <li>✓ Fully responsive design</li>
          <li>✓ Mobile-first approach with collapsible navigation</li>
          <li>✓ Dark mode support</li>
          <li>✓ Smooth scrolling and focus management</li>
          <li>✓ Accessibility improvements</li>
          <li>✓ Modern visual design with hover states</li>
        </ul>
      </div>
    </div>
  );
}
