import React, { useState, useEffect } from 'react';
import './Documents.css';

interface Document {
  _id: string;
  user_id: string;
  file_type: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  file_extension: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('resume');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // 임시 사용자 ID (실제로는 로그인된 사용자 정보에서 가져와야 함)
  const userId = 'user123';

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const fetchDocuments = async () => {
    try {
      const url = filterType === 'all' 
        ? `http://localhost:8000/api/documents/list/${userId}`
        : `http://localhost:8000/api/documents/list/${userId}?file_type=${filterType}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer your-token-here' // 실제 토큰으로 교체 필요
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        setMessage('문서 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      setMessage('서버 연결에 실패했습니다.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('file_type', fileType);
    formData.append('user_id', userId);

    try {
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-token-here' // 실제 토큰으로 교체 필요
        },
        body: formData
      });

      if (response.ok) {
        setMessage('파일이 성공적으로 업로드되었습니다.');
        setSelectedFile(null);
        fetchDocuments();
      } else {
        const errorData = await response.json();
        setMessage(`업로드 실패: ${errorData.detail}`);
      }
    } catch (error) {
      setMessage('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/documents/download/${documentId}`, {
        headers: {
          'Authorization': 'Bearer your-token-here' // 실제 토큰으로 교체 필요
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setMessage('다운로드에 실패했습니다.');
      }
    } catch (error) {
      setMessage('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer your-token-here' // 실제 토큰으로 교체 필요
        }
      });

      if (response.ok) {
        setMessage('파일이 삭제되었습니다.');
        fetchDocuments();
      } else {
        setMessage('삭제에 실패했습니다.');
      }
    } catch (error) {
      setMessage('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getFileTypeLabel = (type: string) => {
    const labels = {
      'resume': '이력서',
      'portfolio': '포트폴리오',
      'cover_letter': '자기소개서'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredDocuments = documents.filter(doc => 
    filterType === 'all' || doc.file_type === filterType
  );

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>📁 문서 관리</h1>
        <p>이력서, 포트폴리오, 자기소개서를 업로드하고 관리하세요.</p>
      </div>

      {/* 파일 업로드 섹션 */}
      <div className="upload-section">
        <h2>📤 파일 업로드</h2>
        <div className="upload-form">
          <div className="form-group">
            <label>파일 타입:</label>
            <select 
              value={fileType} 
              onChange={(e) => setFileType(e.target.value)}
              className="file-type-select"
            >
              <option value="resume">이력서</option>
              <option value="portfolio">포트폴리오</option>
              <option value="cover_letter">자기소개서</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>파일 선택:</label>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
              className="file-input"
            />
          </div>
          
          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || uploading}
            className="upload-button"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`message ${message.includes('성공') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* 필터 섹션 */}
      <div className="filter-section">
        <h2>📋 문서 목록</h2>
        <div className="filter-controls">
          <label>필터:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">전체</option>
            <option value="resume">이력서</option>
            <option value="portfolio">포트폴리오</option>
            <option value="cover_letter">자기소개서</option>
          </select>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="documents-list">
        {filteredDocuments.length === 0 ? (
          <div className="no-documents">
            <p>업로드된 문서가 없습니다.</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc._id} className="document-item">
              <div className="document-info">
                <div className="document-header">
                  <span className="file-type-badge">
                    {getFileTypeLabel(doc.file_type)}
                  </span>
                  <h3>{doc.original_filename}</h3>
                </div>
                <div className="document-details">
                  <p>📅 업로드: {formatDate(doc.upload_date)}</p>
                  <p>📏 크기: {formatFileSize(doc.file_size)}</p>
                  <p>📄 형식: {doc.file_extension.toUpperCase()}</p>
                </div>
              </div>
              <div className="document-actions">
                <button 
                  onClick={() => handleDownload(doc._id, doc.original_filename)}
                  className="download-button"
                >
                  📥 다운로드
                </button>
                <button 
                  onClick={() => handleDelete(doc._id)}
                  className="delete-button"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 지원 형식 안내 */}
      <div className="supported-formats">
        <h3>📋 지원 형식</h3>
        <div className="format-info">
          <div className="format-group">
            <h4>이력서</h4>
            <p>PDF, DOC, DOCX</p>
          </div>
          <div className="format-group">
            <h4>포트폴리오</h4>
            <p>PDF, DOC, DOCX, ZIP, RAR</p>
          </div>
          <div className="format-group">
            <h4>자기소개서</h4>
            <p>PDF, DOC, DOCX, TXT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
