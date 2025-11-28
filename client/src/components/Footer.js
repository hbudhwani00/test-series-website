import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-2 rounded-lg">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Test Series</h3>
                <p className="text-sm text-gray-400">JEE & NEET</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Your trusted platform for comprehensive JEE and NEET test preparation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="https://www.instagram.com/_test.ai/" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Instagram
                </Link>
              </li>
              <li>
                <Link to="https://www.youtube.com/@t_e_s_t.a_i" className="text-gray-400 hover:text-white transition-colors duration-300">
                  YouTube
                </Link>
              </li>
              <li>
                <Link to="https://www.linkedin.com/company/testseries-ai/" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Linkedin
                </Link>
              </li>
            </ul>
          </div>

          {/* Exams */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Exams</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">JEE Main</li>
              <li className="text-gray-400">JEE Advanced</li>
              <li className="text-gray-400">NEET</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center space-x-2">
                <span>📧</span>
                <span>contact@testseriesai.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📞</span>
                <span>+91 7425071550</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>📍</span>
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Test Series. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="#"
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Privacy Policy
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="#"
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Terms of Service
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
