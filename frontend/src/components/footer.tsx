import React, { useState } from 'react';
import { FaDiscord, FaLinkedin, FaTwitter, FaYoutube, FaGithub } from 'react-icons/fa';

const Footer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Footer Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full shadow-lg z-50"
        aria-label="Toggle Footer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {/* Footer Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out shadow-lg ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      } z-40`}>
        <div className="p-6 overflow-y-auto h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Game On</h2>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mb-8">
            <ul className="space-y-3">
              <li>
                <a href="#home" className="hover:text-purple-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-purple-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#developers" className="hover:text-purple-400 transition-colors">
                  Developers
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-purple-400 transition-colors">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </nav>

          {/* Contact Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
            <a
              href="mailto:contact@gameon.com"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              contact@gameon.com
            </a>
          </div>

          {/* Social Links */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <FaGithub size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <FaDiscord size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <FaLinkedin size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <FaYoutube size={24} />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Game On. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
