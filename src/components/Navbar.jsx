import React, { useState, useEffect } from 'react';
import './Navbar.css';

const NavItem = ({ label }) => {
    // Split label into unique characters for staggered animation
    // Each span gets a CSS variable --index for the delay calculation
    const letters = label.split('').map((char, index) => (
        <span key={index} style={{ '--index': index }}>
            {char === ' ' ? ' ' : char}
        </span>
    ));

    // Map labels to section IDs in Home.jsx
    const sectionMap = {
      'Home':    'home',
      'Events':  'events',
      'About':   'about',
      'Contact': 'contact',
    };

    const sectionId = sectionMap[label] || label.toLowerCase().replace(/\s+/g, '-');

    const handleClick = (e) => {
      e.preventDefault();
      // Scroll to top first if navigating to Home
      if (label === 'Home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
        <a href={`#${sectionId}`} className="nav-item" onClick={handleClick}>
            <span className="nav-text-glitch" data-text={label}>
                {letters}
            </span>
        </a>
    );
};

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const menuItems = ['Home', 'Events', 'About', 'Contact'];

    return (
        <>
            {/* HAMBURGER BUTTON - Mobile Only (TOP LEFT) - Outside navbar */}
            <button
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <div className={`hamburger-icon ${mobileMenuOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </button>

            {/* MOBILE MENU OVERLAY */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
                {menuItems.map((item) => (
                    <a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="mobile-menu-item"
                        onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            if (item === 'Home') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                const element = document.getElementById(item.toLowerCase());
                                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                    >
                        {item}
                    </a>
                ))}
            </div>

            {/* DESKTOP NAVBAR */}
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">
                    <div className="nav-menu desktop">
                        {menuItems.map((item) => (
                            <NavItem key={item} label={item} />
                        ))}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
