import React from 'react';
import SMCCDLogo from './SMCCDLogo';

export default function SMCCDLogoDemo() {
  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-heading font-bold text-center mb-8">
        SMCCD Logo Component Demo 🚀
      </h1>

      {/* Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Basic Usage</h2>
        <div className="flex items-center space-x-6 bg-white dark:bg-gray-800 p-6 rounded-lg">
          <SMCCDLogo height={40} />
          <SMCCDLogo height={60} />
          <SMCCDLogo height={80} />
        </div>
      </section>

      {/* Different Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Different Colors</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-600 p-6 rounded-lg">
            <SMCCDLogo height={50} color="#FFFFFF" />
            <p className="text-white mt-2">White on Blue</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <SMCCDLogo height={50} color="#F59E0B" />
            <p className="text-amber-500 mt-2">Amber on Dark</p>
          </div>
          <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
            <SMCCDLogo height={50} color="#1F2937" />
            <p className="text-gray-800 mt-2">Dark on Light</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg">
            <SMCCDLogo height={50} color="#FFFFFF" />
            <p className="text-white mt-2">White on Gradient</p>
          </div>
        </div>
      </section>

      {/* Interactive & Animated */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Interactive & Animated</h2>
        <div className="flex items-center space-x-8 bg-white dark:bg-gray-800 p-6 rounded-lg">
          <div className="text-center">
            <SMCCDLogo 
              height={60} 
              animate={true}
              className="mb-2"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Hover me!</p>
          </div>
          
          <div className="text-center">
            <SMCCDLogo 
              height={60} 
              animate={true}
              onClick={() => alert('Logo clicked! 🎉')}
              className="mb-2"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Click me!</p>
          </div>

          <div className="text-center">
            <SMCCDLogo 
              height={60} 
              className="animate-pulse mb-2"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Pulsing</p>
          </div>

          <div className="text-center">
            <SMCCDLogo 
              height={60} 
              className="animate-bounce mb-2"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Bouncing</p>
          </div>
        </div>
      </section>

      {/* Custom Styling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Custom Styling</h2>
        <div className="flex items-center space-x-8 bg-white dark:bg-gray-800 p-6 rounded-lg">
          <SMCCDLogo 
            height={60} 
            className="drop-shadow-lg"
          />
          
          <SMCCDLogo 
            height={60} 
            className="opacity-50 hover:opacity-100 transition-opacity duration-300"
          />
          
          <SMCCDLogo 
            height={60} 
            className="transform rotate-12 hover:rotate-0 transition-transform duration-300"
          />
          
          <SMCCDLogo 
            height={60} 
            className="filter grayscale hover:grayscale-0 transition-all duration-300"
          />
        </div>
      </section>

      {/* Responsive Sizes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Responsive Sizes</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <SMCCDLogo 
            height={40} 
            className="sm:h-12 md:h-16 lg:h-20 xl:h-24 transition-all duration-300"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Responsive: 40px → 48px → 64px → 80px → 96px
          </p>
        </div>
      </section>

      {/* Navigation Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Navigation Example</h2>
        <nav className="bg-blue-900 text-white p-4 rounded-lg flex items-center justify-between">
          <SMCCDLogo 
            height={40} 
            animate={true}
            onClick={() => alert('Home clicked!')}
          />
          <div className="space-x-6">
            <a href="#" className="hover:text-blue-200">About</a>
            <a href="#" className="hover:text-blue-200">Programs</a>
            <a href="#" className="hover:text-blue-200">Contact</a>
          </div>
        </nav>
      </section>

      {/* Footer Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Footer Example</h2>
        <footer className="bg-gray-800 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SMCCDLogo height={32} />
              <div>
                <p className="font-semibold">San Mateo County Community College District</p>
                <p className="text-sm text-gray-400">Excellence in Education</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>© 2025 SMCCD</p>
              <p>All rights reserved</p>
            </div>
          </div>
        </footer>
      </section>

      {/* Code Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold">Usage Examples</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
          <div className="space-y-2">
            <p>{"// Basic usage"}</p>
            <p className="text-yellow-300">&lt;SMCCDLogo height={`{60}`} /&gt;</p>
            <br />
            <p>{"// Custom color and animation"}</p>
            <p className="text-yellow-300">&lt;SMCCDLogo height={`{50}`} color="#F59E0B" animate={`{true}`} /&gt;</p>
            <br />
            <p>{"// Clickable with custom styling"}</p>
            <p className="text-yellow-300">&lt;SMCCDLogo</p>
            <p className="text-yellow-300 ml-4">height={`{40}`}</p>
            <p className="text-yellow-300 ml-4">onClick={`{() => alert('Clicked!')}`}</p>
            <p className="text-yellow-300 ml-4">className="hover:scale-110 transition-transform"</p>
            <p className="text-yellow-300">/&gt;</p>
          </div>
        </div>
      </section>
    </div>
  );
}