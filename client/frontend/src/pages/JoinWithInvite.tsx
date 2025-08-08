import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  faEnvelope, faUser, faLock, faCheckCircle, faTimesCircle, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './JoinWithInvite.css';

interface InviteInfo {
  email: string;
  name: string;
  role: string;
  department: string;
  position: string;
  company: string;
}

const JoinWithInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      validateInviteCode(code);
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-invite/${code}`);
      const data = await response.json();

      if (data.valid) {
        setInviteInfo(data.invite);
        setFormData(prev => ({
          ...prev,
          email: data.invite.email,
          name: data.invite.name
        }));
      } else {
        setError(data.message || '유효하지 않은 초대 코드입니다.');
      }
    } catch (error) {
      console.error('초대 코드 검증 오류:', error);
      setError('초대 코드 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/invite-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          invite_code: inviteCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 성공 시 처리
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('회원가입이 완료되었습니다!');
        navigate('/admin'); // 관리자 페이지로 이동
      } else {
        setError(data.detail || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  if (isValidating) {
    return (
      <div className="join-invite-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>초대 코드를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="join-invite-container">
        <div className="error-card">
          <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
          <h2>초대 코드 오류</h2>
          <p>{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-invite-container">
      <div className="join-card">
        <div className="join-header">
          <h1>회사 초대 가입</h1>
          <p>초대 코드를 통해 회사에 가입합니다</p>
        </div>

        {inviteInfo && (
          <div className="invite-info-card">
            <div className="invite-details">
              <h3>초대 정보</h3>
              <div className="info-item">
                <FontAwesomeIcon icon={faEnvelope} />
                <span><strong>회사:</strong> {inviteInfo.company}</span>
              </div>
              <div className="info-item">
                <FontAwesomeIcon icon={faUser} />
                <span><strong>역할:</strong> {inviteInfo.role === 'admin' ? '관리자' : inviteInfo.role === 'manager' ? '매니저' : '멤버'}</span>
              </div>
              {inviteInfo.department && (
                <div className="info-item">
                  <FontAwesomeIcon icon={faUser} />
                  <span><strong>부서:</strong> {inviteInfo.department}</span>
                </div>
              )}
              {inviteInfo.position && (
                <div className="info-item">
                  <FontAwesomeIcon icon={faUser} />
                  <span><strong>직책:</strong> {inviteInfo.position}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="join-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <FontAwesomeIcon icon={faEnvelope} />
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="disabled-input"
              disabled
            />
            <small>초대 코드에서 자동으로 입력되었습니다</small>
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <FontAwesomeIcon icon={faUser} />
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="disabled-input"
              disabled
            />
            <small>초대 코드에서 자동으로 입력되었습니다</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FontAwesomeIcon icon={faLock} />
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FontAwesomeIcon icon={faLock} />
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              placeholder="비밀번호를 다시 입력하세요"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입 완료'}
          </button>
        </form>

        <div className="join-footer">
          <p>
            이미 계정이 있으신가요?
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/')}
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinWithInvite; 