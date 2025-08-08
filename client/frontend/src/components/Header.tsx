import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faChevronDown,
  faUser,
  faSearch,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import AuthModal from './AuthModal';
import './Header.css';

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 페이지 로드 시 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLoginClick = () => {
    if (user) {
      // 로그인된 상태에서는 사용자 프로필 드롭다운 표시
      return;
    }
    setIsAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
  };

  const handleLoginSuccess = (user: any, token: string) => {
    setUser(user);
    setIsAuthModalOpen(false);
    
    // 사용자 타입에 따른 리다이렉션
    if (user.userType === 'recruiter') {
      // 채용담당자는 admin 프론트엔드로 이동
      window.location.href = 'http://localhost:3001';
    } else {
      // 구직자는 현재 페이지에 머무름
      console.log('구직자 로그인 성공');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const menuItems = [
    { text: '공고', href: '/jobs' },
    { text: '지원서', href: '/applications' },
    { text: '포트폴리오', href: '/portfolio' },
    { text: '인재추천', href: '/recommendations' },
    { text: '면접', href: '/interviews' },
  ];

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* 로고 */}
          <a href="/" className="logo">
            HireMe
          </a>

          {/* 데스크톱 메뉴 */}
          <nav className="desktop-menu">
            {menuItems.map((item) => (
              <a key={item.text} href={item.href} className="menu-item">
                {item.text}
              </a>
            ))}
          </nav>

          {/* 우측 버튼들 */}
          <div className="header-actions">
            <button className="icon-button">
              <FontAwesomeIcon icon={faSearch} />
            </button>
            {user ? (
              <div className="user-profile">
                <button className="user-profile-button" onClick={handleLoginClick}>
                  <FontAwesomeIcon icon={faUser} />
                  <span>{user.name}님 ({user.userType === 'jobseeker' ? '구직자' : '채용담당자'})</span>
                  <FontAwesomeIcon icon={faChevronDown} />
                </button>
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            ) : (
              <button className="login-button" onClick={handleLoginClick}>
                <FontAwesomeIcon icon={faUser} />
                <span>로그인</span>
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button 
            className="mobile-menu-button"
            onClick={handleDrawerToggle}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </header>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="mobile-drawer">
          <nav className="mobile-menu">
            {menuItems.map((item) => (
              <a key={item.text} href={item.href} className="mobile-menu-item">
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthModalClose}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default Header; 