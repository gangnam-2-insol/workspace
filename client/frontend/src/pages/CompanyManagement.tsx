import React, { useState, useEffect } from 'react';
import { 
  faUserPlus, faUsers, faEnvelope, faTrash, faEdit,
  faCrown, faUserTie, faUser, faCopy, faCheck, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './CompanyManagement.css';

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  role: string;
  department: string;
  position: string;
  createdAt: string;
}

interface Invite {
  id: string;
  code: string;
  email: string;
  name: string;
  role: string;
  department: string;
  position: string;
  isUsed: boolean;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  website: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

const CompanyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'invites'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'member',
    department: '',
    position: ''
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      setError('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    const userData = JSON.parse(user);
    if (userData.userType !== 'recruiter') {
      setError('채용담당자만 접근할 수 있습니다.');
      setIsLoading(false);
      return;
    }

    await Promise.all([
      loadCompanyInfo(),
      loadUsers(),
      loadInvites()
    ]);
    setIsLoading(false);
  };

  const loadCompanyInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data.company);
      } else {
        console.error('회사 정보 로드 실패');
      }
    } catch (error) {
      console.error('회사 정보 로드 오류:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('사용자 목록 로드 실패');
      }
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
    }
  };

  const loadInvites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/invites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      } else {
        console.error('초대 목록 로드 실패');
      }
    } catch (error) {
      console.error('초대 목록 로드 오류:', error);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`초대가 성공적으로 생성되었습니다.\n초대 코드: ${data.invite_code}`);
        setShowInviteModal(false);
        setInviteForm({
          email: '',
          name: '',
          role: 'member',
          department: '',
          position: ''
        });
        loadInvites();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || '초대 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('초대 생성 오류:', error);
      alert('초대 생성 중 오류가 발생했습니다.');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm('정말로 이 초대를 취소하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('초대가 취소되었습니다.');
        loadInvites();
      } else {
        alert('초대 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('초대 취소 오류:', error);
      alert('초대 취소 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/users/${userId}/role?role=${newRole}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('사용자 역할이 변경되었습니다.');
        loadUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || '역할 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('역할 변경 오류:', error);
      alert('역할 변경 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!window.confirm(`정말로 ${userName}님을 회사에서 제거하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/company/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('사용자가 제거되었습니다.');
        loadUsers();
      } else {
        alert('사용자 제거에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 제거 오류:', error);
      alert('사용자 제거 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('클립보드 복사 오류:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return faCrown;
      case 'manager': return faUserTie;
      default: return faUser;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ff6b6b';
      case 'manager': return '#4ecdc4';
      default: return '#95a5a6';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'manager': return '매니저';
      default: return '멤버';
    }
  };

  if (isLoading) {
    return (
      <div className="company-management-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-management-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="company-management-container">
      <div className="company-header">
        <h1>회사 관리</h1>
        <p>{companyInfo?.name} 회사 관리 페이지입니다.</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          직원 관리
        </button>
        <button
          className={`tab-button ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
        >
          초대 관리
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>총 직원 수</h3>
                <p>{users.length}명</p>
              </div>
              <div className="stat-card">
                <h3>활성 초대</h3>
                <p>{invites.filter(invite => !invite.isUsed).length}개</p>
              </div>
            </div>

            {companyInfo && (
              <div className="company-info-card">
                <h3>회사 정보</h3>
                <div className="info-grid">
                  <div>
                    <strong>회사명:</strong> {companyInfo.name}
                  </div>
                  <div>
                    <strong>설명:</strong> {companyInfo.description || '설명 없음'}
                  </div>
                  <div>
                    <strong>산업:</strong> {companyInfo.industry || '미설정'}
                  </div>
                  <div>
                    <strong>규모:</strong> {companyInfo.size || '미설정'}
                  </div>
                  <div>
                    <strong>웹사이트:</strong> {companyInfo.website || '미설정'}
                  </div>
                  <div>
                    <strong>주소:</strong> {companyInfo.address || '미설정'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="tab-header">
              <h3>직원 목록</h3>
              <button
                className="invite-button"
                onClick={() => setShowInviteModal(true)}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                새 직원 초대
              </button>
            </div>

            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <div className="user-avatar">
                      <FontAwesomeIcon 
                        icon={getRoleIcon(user.role)} 
                        style={{ color: getRoleColor(user.role) }}
                      />
                    </div>
                    <div className="user-details">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                      <p>{user.department} • {user.position}</p>
                    </div>
                  </div>
                  <div className="user-actions">
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                    >
                      <option value="member">멤버</option>
                      <option value="manager">매니저</option>
                      <option value="admin">관리자</option>
                    </select>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveUser(user.id, user.name)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="invites-tab">
            <div className="tab-header">
              <h3>초대 목록</h3>
              <button
                className="invite-button"
                onClick={() => setShowInviteModal(true)}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                새 초대 생성
              </button>
            </div>

            <div className="invites-list">
              {invites.map(invite => (
                <div key={invite.id} className={`invite-card ${invite.isUsed ? 'used' : ''}`}>
                  <div className="invite-info">
                    <h4>{invite.name}</h4>
                    <p>{invite.email}</p>
                    <p>{invite.department} • {invite.position}</p>
                    <span className={`status-badge ${invite.isUsed ? 'used' : 'active'}`}>
                      {invite.isUsed ? '사용됨' : '대기중'}
                    </span>
                  </div>
                  <div className="invite-actions">
                    {!invite.isUsed && (
                      <>
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(invite.code)}
                        >
                          <FontAwesomeIcon icon={copiedCode === invite.code ? faCheck : faCopy} />
                          {copiedCode === invite.code ? '복사됨' : '코드 복사'}
                        </button>
                        <button
                          className="cancel-button"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          취소
                        </button>
                      </>
                    )}
                    {invite.isUsed && (
                      <span className="used-badge">
                        <FontAwesomeIcon icon={faCheck} />
                        사용됨
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 초대 모달 */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>새 직원 초대</h3>
              <button
                className="close-button"
                onClick={() => setShowInviteModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit}>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>역할</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                >
                  <option value="member">멤버</option>
                  <option value="manager">매니저</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              <div className="form-group">
                <label>부서</label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({...inviteForm, department: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>직책</label>
                <input
                  type="text"
                  value={inviteForm.position}
                  onChange={(e) => setInviteForm({...inviteForm, position: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowInviteModal(false)}>
                  취소
                </button>
                <button type="submit" className="submit-button">
                  초대 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement; 