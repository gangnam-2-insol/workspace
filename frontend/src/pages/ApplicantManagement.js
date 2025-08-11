import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiFileText, 
  FiEye, 
  FiDownload,
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiStar,
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiFile,
  FiMessageSquare,
  FiCode,
  FiGrid,
  FiList
} from 'react-icons/fi';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 16px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: 14px;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
  justify-content: space-between;
`;

const SearchSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
`;

const ViewModeSection = styled.div`
  display: flex;
  gap: 8px;
`;

const ViewModeButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.active ? 'var(--primary-color)' : 'white'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-color);
    color: ${props => props.active ? 'white' : 'var(--primary-color)'};
  }
`;

// 헤더 스타일 컴포넌트들
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--background-secondary);
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
`;

const HeaderRowBoard = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--background-secondary);
  border-radius: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  height: 40px;
  gap: 12px;
`;

const HeaderAvatar = styled.div`
  width: 32px;
  flex-shrink: 0;
`;

const HeaderName = styled.div`
  min-width: 100px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderPosition = styled.div`
  min-width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderDate = styled.div`
  min-width: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const HeaderEmail = styled.div`
  min-width: 160px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderPhone = styled.div`
  min-width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderSkills = styled.div`
  min-width: 150px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderActions = styled.div`
  min-width: 200px;
  flex-shrink: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderRanks = styled.div`
  min-width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: var(--primary-color);
  }
`;

const FilterButton = styled.button`
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
`;

// 필터 모달 스타일
const FilterModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 20px;
`;

const FilterModalContent = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  position: relative;
`;

const FilterModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const FilterModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
`;

const FilterCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--background-secondary);
    color: var(--text-primary);
  }
`;

const FilterSection = styled.div`
  margin-bottom: 24px;
`;

const FilterSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;

const FilterColumn = styled.div``;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
`;

const ApplyButton = styled.button`
  background: linear-gradient(135deg, var(--primary-color), #00a844);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 24px;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ApplicantsGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : '1fr'};
  gap: ${props => props.viewMode === 'grid' ? '24px' : '16px'};
`;

const ApplicantsBoard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ApplicantCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: ${props => props.viewMode === 'grid' ? '24px' : '20px'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ApplicantCardBoard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  height: ${props => props.isHovered ? '84px' : '56px'};
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ApplicantHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ApplicantHeaderBoard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const ApplicantInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ApplicantInfoBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), #00a844);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
`;

const AvatarBoard = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), #00a844);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const AiSuitabilityAvatarBoard = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => {
    if (props.percentage >= 90) return 'linear-gradient(135deg, #22c55e, #16a34a)';
    if (props.percentage >= 80) return 'linear-gradient(135deg, #eab308, #ca8a04)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 10px;
  text-align: center;
  line-height: 1;
`;

const ApplicantDetails = styled.div`
  flex: 1;
`;

const ApplicantDetailsBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const ApplicantName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
`;

const ApplicantNameBoard = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 100px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ApplicantPosition = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 4px;
`;

const ApplicantPositionBoard = styled.p`
  color: var(--text-secondary);
  font-size: 12px;
  min-width: 120px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ApplicantDate = styled.p`
  color: var(--text-light);
  font-size: 12px;
`;

const ApplicantDateBoard = styled.p`
  color: var(--text-light);
  font-size: 11px;
  min-width: 80px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
`;

const ApplicantContactBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
  justify-content: center;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--text-secondary);
  justify-content: center;
`;

const ApplicantSkillsBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 150px;
  justify-content: center;
`;

const SkillTagBoard = styled.span`
  padding: 1px 4px;
  background: var(--background-secondary);
  border-radius: 4px;
  font-size: 9px;
  color: var(--text-secondary);
`;

const ApplicantActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  opacity: ${props => props.isHovered ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const ApplicantActionsBoard = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  opacity: ${props => props.isHovered ? 1 : 0};
  transition: opacity 0.2s ease;
  margin-top: ${props => props.isHovered ? '8px' : '0'};
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  background: ${props => {
    switch (props.status) {
      case '서류합격': return '#e8f5e8';
      case '서류불합격': return '#ffe8e8';
      case '면접대기': return '#fff3cd';
      case '최종합격': return '#d1ecf1';
      case '보류': return '#fff8dc';
      default: return '#f8f9fa';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case '서류합격': return '#28a745';
      case '서류불합격': return '#dc3545';
      case '면접대기': return '#856404';
      case '최종합격': return '#0c5460';
      case '보류': return '#856404';
      default: return '#6c757d';
    }
  }};
`;

const StatusColumnWrapper = styled.div`
  min-width: 200px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: white;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
`;

const PassButton = styled(ActionButton)`
  background: #28a745;
  color: white;
  border-color: #28a745;
  
  &:hover {
    background: #218838;
    border-color: #1e7e34;
    color: white;
  }
`;

const PendingButton = styled(ActionButton)`
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
  
  &:hover {
    background: #e0a800;
    border-color: #d39e00;
    color: #212529;
  }
`;

const RejectButton = styled(ActionButton)`
  background: #dc3545;
  color: white;
  border-color: #dc3545;
  
  &:hover {
    background: #c82333;
    border-color: #bd2130;
    color: white;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
`;

// 모달 스타일
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--background-secondary);
    color: var(--text-primary);
  }
`;

const ProfileSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const ProfileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 8px;
`;

const ProfileLabel = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 80px;
`;

const ProfileValue = styled.span`
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
`;

const SummarySection = styled.div`
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
`;

const SummaryTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryText = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  background: white;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
`;

const DocumentButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 50px;
`;

const DocumentButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-color), #00a844);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

// 문서 모달 스타일
const DocumentModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const DocumentModalContent = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const DocumentModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const DocumentModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
`;

const DocumentCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--background-secondary);
    color: var(--text-primary);
  }
`;

const DocumentContent = styled.div`
  line-height: 1.8;
  color: var(--text-primary);
`;

const DocumentSection = styled.div`
  margin-bottom: 24px;
`;

const DocumentSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-color);
`;

const DocumentText = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-align: justify;
`;

const DocumentList = styled.ul`
  margin: 16px 0;
  padding-left: 20px;
`;

const DocumentListItem = styled.li`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.6;
`;

const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 16px 0;
`;

const DocumentCard = styled.div`
  background: var(--background-secondary);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
`;

const DocumentCardTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const DocumentCardText = styled.p`
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
`;

const SkillsSection = styled.div`
  margin-top: 24px;
`;

const SkillsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SkillsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SkillTag = styled.span`
  padding: 6px 12px;
  background: linear-gradient(135deg, var(--primary-color), #00a844);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const AiAnalysisSection = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
`;

const AiAnalysisTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AiAnalysisContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SuitabilityGraph = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CircularProgress = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    ${props => {
      if (props.percentage >= 90) return '#10b981';
      if (props.percentage >= 80) return '#f59e0b';
      return '#ef4444';
    }} 0deg ${props => props.percentage * 3.6}deg,
    #e5e7eb ${props => props.percentage * 3.6}deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    width: 80%;
    height: 80%;
    background: white;
    border-radius: 50%;
  }
`;

const PercentageText = styled.div`
  position: absolute;
  font-size: 12px;
  font-weight: 700;
  color: ${props => {
    if (props.percentage >= 90) return '#10b981';
    if (props.percentage >= 80) return '#f59e0b';
    return '#ef4444';
  }};
`;

const SuitabilityInfo = styled.div`
  flex: 1;
`;

const SuitabilityLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const SuitabilityValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => {
    if (props.percentage >= 90) return '#10b981';
    if (props.percentage >= 80) return '#f59e0b';
    return '#ef4444';
  }};
`;

// Board view specific AI analysis components
const AiAnalysisSectionBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
`;

const AiAnalysisTitleBoard = styled.h4`
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SuitabilityGraphBoard = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CircularProgressBoard = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    ${props => {
      if (props.percentage >= 90) return '#10b981';
      if (props.percentage >= 80) return '#f59e0b';
      return '#ef4444';
    }} 0deg ${props => props.percentage * 3.6}deg,
    #e5e7eb ${props => props.percentage * 3.6}deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    width: 80%;
    height: 80%;
    background: white;
    border-radius: 50%;
  }
`;

const PercentageTextBoard = styled.div`
  position: absolute;
  font-size: 8px;
  font-weight: 700;
  color: ${props => {
    if (props.percentage >= 90) return '#10b981';
    if (props.percentage >= 80) return '#f59e0b';
    return '#ef4444';
  }};
`;

const SuitabilityValueBoard = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${props => {
    if (props.percentage >= 90) return '#10b981';
    if (props.percentage >= 80) return '#f59e0b';
    return '#ef4444';
  }};
`;

const ApplicantRanksBoard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
`;

const RankItem = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 9px;
  color: var(--text-secondary);
  white-space: nowrap;
`;

const RankBadge = styled.span`
  padding: 1px 3px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 600;
  background: ${props => {
    if (props.rank <= 2) return '#10b981';
    if (props.rank <= 4) return '#f59e0b';
    return '#ef4444';
  }};
  color: white;
`;

const sampleApplicants = [
  {
    id: 1,
    name: '김지원',
    position: '프론트엔드 개발자',
    department: '개발팀',
    email: 'kim.jiwon@email.com',
    phone: '010-1234-5678',
    appliedDate: '2024-01-15',
    status: '지원',
    experience: '3년',
    skills: ['React', 'TypeScript', 'JavaScript'],
    rating: 4.5,
    summary: 'React와 TypeScript에 능숙하며, 사용자 경험을 중시하는 프론트엔드 개발자입니다. 팀 프로젝트에서 리더 역할을 수행한 경험이 있고, 새로운 기술 학습에 적극적입니다.',
    documents: {
      resume: {
        personalInfo: {
          name: '김지원',
          email: 'kim.jiwon@email.com',
          phone: '010-1234-5678',
          address: '서울시 강남구',
          birth: '1995.03.15'
        },
        education: [
          {
            school: '서울대학교',
            major: '컴퓨터공학과',
            degree: '학사',
            period: '2014.03 - 2018.02',
            gpa: '4.2/4.5'
          }
        ],
        experience: [
          {
            company: '테크스타트업',
            position: '프론트엔드 개발자',
            period: '2021.03 - 현재',
            description: 'React와 TypeScript를 활용한 웹 애플리케이션 개발, 사용자 경험 개선 프로젝트 리드'
          },
          {
            company: 'IT컨설팅',
            position: '웹 개발자',
            period: '2018.03 - 2021.02',
            description: 'JavaScript 기반 웹사이트 개발, 반응형 디자인 구현'
          }
        ],
        skills: {
          programming: ['JavaScript', 'TypeScript', 'React', 'Vue.js', 'HTML/CSS'],
          tools: ['Git', 'Webpack', 'VS Code', 'Figma'],
          languages: ['한국어', '영어']
        }
      },
      coverLetter: {
        motivation: '사용자 중심의 웹 애플리케이션을 개발하여 더 나은 디지털 경험을 제공하고 싶습니다. React 생태계에 대한 깊은 이해와 팀 협업 경험을 바탕으로 혁신적인 제품 개발에 기여하고자 합니다.',
        strengths: [
          '사용자 경험을 중시하는 개발 철학',
          '새로운 기술 학습에 대한 적극적인 자세',
          '팀 프로젝트에서의 리더십 경험',
          '문제 해결 능력과 창의적 사고'
        ],
        goals: '3년 내에 프론트엔드 아키텍트로 성장하여 팀의 기술적 방향을 이끌고, 사용자에게 최고의 경험을 제공하는 제품을 만들어가고 싶습니다.'
      },
      portfolio: {
        projects: [
          {
            title: 'E-커머스 플랫폼',
            description: 'React와 TypeScript를 활용한 온라인 쇼핑몰 개발',
            technologies: ['React', 'TypeScript', 'Redux', 'Styled-components'],
            features: ['반응형 디자인', '장바구니 기능', '결제 시스템 연동', '관리자 대시보드'],
            github: 'https://github.com/kimjiwon/ecommerce',
            demo: 'https://ecommerce-demo.com'
          },
          {
            title: '실시간 채팅 앱',
            description: 'Socket.io를 활용한 실시간 메신저 애플리케이션',
            technologies: ['React', 'Socket.io', 'Node.js', 'MongoDB'],
            features: ['실시간 메시징', '파일 공유', '그룹 채팅', '이모지 지원'],
            github: 'https://github.com/kimjiwon/chat-app',
            demo: 'https://chat-app-demo.com'
          },
          {
            title: '날씨 정보 앱',
            description: 'OpenWeather API를 활용한 날씨 정보 제공 애플리케이션',
            technologies: ['React', 'OpenWeather API', 'Chart.js', 'PWA'],
            features: ['실시간 날씨 정보', '5일 예보', '위치 기반 서비스', '오프라인 지원'],
            github: 'https://github.com/kimjiwon/weather-app',
            demo: 'https://weather-app-demo.com'
          }
        ],
        achievements: [
          '2023년 개발자 컨퍼런스 발표자 선정',
          '오픈소스 프로젝트 50+ 기여',
          'GitHub 스타 200+ 획득',
          '개발 블로그 월 10,000+ 방문자'
        ]
      }
    },
    aiSuitability: 92,
    aiScores: {
      resume: 88,
      coverLetter: 92,
      portfolio: 95
    }
  },
  {
    id: 2,
    name: '박민수',
    position: '백엔드 개발자',
    department: '개발팀',
    email: 'park.minsu@email.com',
    phone: '010-2345-6789',
    appliedDate: '2024-01-14',
    status: '지원',
    experience: '5년',
    skills: ['Java', 'Spring', 'MySQL'],
    rating: 4.8,
    summary: 'Spring Framework와 Java 개발에 전문성을 가지고 있으며, 대용량 데이터 처리와 시스템 아키텍처 설계 경험이 풍부합니다. 마이크로서비스 아키텍처 구축 경험이 있습니다.',
    aiSuitability: 88,
    aiScores: {
      resume: 85,
      coverLetter: 88,
      portfolio: 90
    }
  },
  {
    id: 3,
    name: '이서연',
    position: 'UI/UX 디자이너',
    department: '디자인팀',
    email: 'lee.seoyeon@email.com',
    phone: '010-3456-7890',
    appliedDate: '2024-01-13',
    status: '지원',
    experience: '2년',
    skills: ['Figma', 'Adobe XD', 'Photoshop'],
    rating: 3.9,
    summary: '사용자 중심의 디자인을 추구하며, 프로토타이핑과 사용자 테스트를 통한 디자인 검증 경험이 있습니다. 브랜드 아이덴티티 디자인에도 관심이 많습니다.',
    aiSuitability: 75,
    aiScores: {
      resume: 72,
      coverLetter: 75,
      portfolio: 78
    }
  },
  {
    id: 4,
    name: '정현우',
    position: 'DevOps 엔지니어',
    department: '인프라팀',
    email: 'jung.hyunwoo@email.com',
    phone: '010-4567-8901',
    appliedDate: '2024-01-12',
    status: '지원',
    experience: '4년',
    skills: ['Docker', 'Kubernetes', 'AWS'],
    rating: 4.7,
    summary: '클라우드 인프라 구축과 컨테이너 오케스트레이션에 전문성을 가지고 있으며, CI/CD 파이프라인 구축과 모니터링 시스템 설계 경험이 풍부합니다.',
    aiSuitability: 95,
    aiScores: {
      resume: 92,
      coverLetter: 95,
      portfolio: 98
    }
  },
  {
    id: 5,
    name: '최수진',
    position: '데이터 분석가',
    department: '데이터팀',
    email: 'choi.sujin@email.com',
    phone: '010-5678-9012',
    appliedDate: '2024-01-11',
    status: '지원',
    experience: '3년',
    skills: ['Python', 'SQL', 'Tableau'],
    rating: 4.2,
    summary: '데이터 분석과 시각화에 전문성을 가지고 있으며, 비즈니스 인사이트 도출을 통한 의사결정 지원 경험이 풍부합니다. 머신러닝 모델 개발 경험도 있습니다.',
    aiSuitability: 82,
    aiScores: {
      resume: 80,
      coverLetter: 82,
      portfolio: 85
    }
  },
  {
    id: 6,
    name: '강동현',
    position: '모바일 개발자',
    department: '개발팀',
    email: 'kang.donghyun@email.com',
    phone: '010-6789-0123',
    appliedDate: '2024-01-10',
    status: '지원',
    experience: '6년',
    skills: ['iOS', 'Swift', 'Android'],
    rating: 4.6,
    summary: 'iOS와 Android 플랫폼 모두에서 앱 개발 경험이 풍부하며, 네이티브 앱과 크로스 플랫폼 개발 모두 가능합니다. 사용자 경험을 중시하는 앱 개발에 특화되어 있습니다.',
    aiSuitability: 89,
    aiScores: {
      resume: 87,
      coverLetter: 89,
      portfolio: 92
    }
  }
];

const ApplicantManagement = () => {
  const [applicants, setApplicants] = useState(sampleApplicants);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('전체');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentModal, setDocumentModal] = useState({ isOpen: false, type: '', applicant: null });
  const [filterModal, setFilterModal] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [hoveredApplicant, setHoveredApplicant] = useState(null);

  // Calculate ranks for each applicant
  const calculateRanks = () => {
    const resumeScores = applicants.map(a => a.aiScores?.resume || 0);
    const coverLetterScores = applicants.map(a => a.aiScores?.coverLetter || 0);
    const portfolioScores = applicants.map(a => a.aiScores?.portfolio || 0);
    const totalScores = applicants.map(a => a.aiSuitability || 0);

    const getRank = (score, scores) => {
      const sortedScores = [...scores].sort((a, b) => b - a);
      return sortedScores.indexOf(score) + 1;
    };

    return applicants.map(applicant => ({
      ...applicant,
      ranks: {
        resume: getRank(applicant.aiScores?.resume || 0, resumeScores),
        coverLetter: getRank(applicant.aiScores?.coverLetter || 0, coverLetterScores),
        portfolio: getRank(applicant.aiScores?.portfolio || 0, portfolioScores),
        total: getRank(applicant.aiSuitability || 0, totalScores)
      }
    }));
  };

  const applicantsWithRanks = calculateRanks();

  const stats = {
    total: applicants.length,
    passed: applicants.filter(a => a.status === '서류합격' || a.status === '최종합격').length,
    waiting: applicants.filter(a => a.status === '보류').length,
    rejected: applicants.filter(a => a.status === '서류불합격').length
  };

  const filteredApplicants = applicantsWithRanks.filter(applicant => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = applicant.name.toLowerCase().includes(searchLower) ||
                         applicant.position.toLowerCase().includes(searchLower) ||
                         applicant.email.toLowerCase().includes(searchLower) ||
                         applicant.skills.some(skill => skill.toLowerCase().includes(searchLower));
    
    const matchesFilter = filterStatus === '전체' || applicant.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleCardClick = (applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
  };

  const handleUpdateStatus = (applicantId, newStatus) => {
    setApplicants(prev => 
      prev.map(applicant => {
        if (applicant.id === applicantId) {
          let finalStatus = newStatus;
          if (newStatus === '합격') {
            finalStatus = '서류합격';
          } else if (newStatus === '보류') {
            finalStatus = '보류';
          } else if (newStatus === '불합격') {
            finalStatus = '서류불합격';
          }
          return { ...applicant, status: finalStatus };
        }
        return applicant;
      })
    );
  };

  const handleDocumentClick = (type, applicant) => {
    setDocumentModal({ isOpen: true, type, applicant });
  };

  const handleCloseDocumentModal = () => {
    setDocumentModal({ isOpen: false, type: '', applicant: null });
  };

  const handleFilterClick = () => {
    setFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    setFilterModal(false);
  };

  const handleJobChange = (job) => {
    setSelectedJobs(prev => 
      prev.includes(job) 
        ? prev.filter(j => j !== job)
        : [...prev, job]
    );
  };

  const handleExperienceChange = (experience) => {
    setSelectedExperience(prev => 
      prev.includes(experience) 
        ? prev.filter(e => e !== experience)
        : [...prev, experience]
    );
  };

  const handleApplyFilter = () => {
    setFilterModal(false);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  return (
    <Container>
      <Header>
        <Title>지원자 관리</Title>
        <Subtitle>채용 공고별 지원자 현황을 관리하고 검토하세요</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatValue>{stats.total}</StatValue>
          <StatLabel>총 지원자</StatLabel>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatValue>{stats.passed}</StatValue>
          <StatLabel>서류 합격</StatLabel>
        </StatCard>
                 <StatCard
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
         >
           <StatValue>{stats.waiting}</StatValue>
           <StatLabel>보류</StatLabel>
         </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatValue>{stats.rejected}</StatValue>
          <StatLabel>서류 불합격</StatLabel>
        </StatCard>
      </StatsGrid>

      <SearchBar>
        <SearchSection>
          <SearchInput
            type="text"
            placeholder="지원자 이름,직무,기술스택을 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterButton onClick={handleFilterClick}>
            <FiFilter size={16} />
            필터
          </FilterButton>
        </SearchSection>
        <ViewModeSection>
                              <ViewModeButton
                      active={viewMode === 'grid'}
                      onClick={() => handleViewModeChange('grid')}
                    >
                      <FiGrid size={14} />
                      그리드
                    </ViewModeButton>
                    <ViewModeButton
                      active={viewMode === 'board'}
                      onClick={() => handleViewModeChange('board')}
                    >
                      <FiList size={14} />
                      게시판
                    </ViewModeButton>
        </ViewModeSection>
      </SearchBar>

      {/* 게시판 보기 헤더 */}
      {viewMode === 'board' && (
        <HeaderRowBoard>
          <HeaderAvatar></HeaderAvatar>
          <HeaderName>이름</HeaderName>
          <HeaderPosition>직무</HeaderPosition>
          <HeaderEmail>이메일</HeaderEmail>
          <HeaderPhone>전화번호</HeaderPhone>
          <HeaderSkills>기술스택</HeaderSkills>
          <HeaderDate>지원일</HeaderDate>
          <HeaderRanks>각 항목별 등수</HeaderRanks>
          <HeaderActions>상태</HeaderActions>
        </HeaderRowBoard>
      )}

      {viewMode === 'grid' ? (
        <ApplicantsGrid viewMode={viewMode}>
          {filteredApplicants.map((applicant, index) => (
            <ApplicantCard
              key={applicant.id}
              viewMode={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCardClick(applicant)}
              onMouseEnter={() => setHoveredApplicant(applicant.id)}
              onMouseLeave={() => setHoveredApplicant(null)}
            >
              <ApplicantHeader>
                <ApplicantInfo>
                  <Avatar>
                    {applicant.name.charAt(0)}
                  </Avatar>
                  <ApplicantDetails>
                    <ApplicantName>{applicant.name}</ApplicantName>
                    <ApplicantPosition>{applicant.position}</ApplicantPosition>
                    <ApplicantDate>지원일: {applicant.appliedDate}</ApplicantDate>
                  </ApplicantDetails>
                </ApplicantInfo>
                {applicant.status !== '지원' && (
                  <StatusBadge status={applicant.status}>
                    {applicant.status}
                  </StatusBadge>
                )}
              </ApplicantHeader>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FiMail size={14} />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {applicant.email}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FiPhone size={14} />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {applicant.phone}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiStar size={14} />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    경력 {applicant.experience} | 평점 {applicant.rating}/5.0
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>
                  주요 기술
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {applicant.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      style={{
                        padding: '2px 8px',
                        background: 'var(--background-secondary)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <AiAnalysisSection>
                <AiAnalysisTitle>
                  <FiCode size={14} />
                  AI 분석 결과 적합도
                </AiAnalysisTitle>
                <AiAnalysisContent>
                  <SuitabilityGraph>
                    <CircularProgress percentage={applicant.aiSuitability}>
                      <PercentageText percentage={applicant.aiSuitability}>
                        {applicant.aiSuitability}%
                      </PercentageText>
                    </CircularProgress>
                  </SuitabilityGraph>
                  <SuitabilityInfo>
                    <SuitabilityLabel>적합도</SuitabilityLabel>
                    <SuitabilityValue percentage={applicant.aiSuitability}>
                      {applicant.aiSuitability >= 90 ? '매우 적합' : 
                       applicant.aiSuitability >= 80 ? '적합' : '부적합'}
                    </SuitabilityValue>
                  </SuitabilityInfo>
                </AiAnalysisContent>
              </AiAnalysisSection>

              <ApplicantActions isHovered={hoveredApplicant === applicant.id}>
                <PassButton onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(applicant.id, '합격');
                }}>
                  <FiCheck size={14} />
                  합격
                </PassButton>
                <PendingButton onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(applicant.id, '보류');
                }}>
                  <FiClock size={14} />
                  보류
                </PendingButton>
                <RejectButton onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(applicant.id, '불합격');
                }}>
                  <FiX size={14} />
                  불합격
                </RejectButton>
              </ApplicantActions>
            </ApplicantCard>
          ))}
        </ApplicantsGrid>
      ) : (
        <ApplicantsBoard>
          {filteredApplicants.map((applicant, index) => (
            <ApplicantCardBoard
              key={applicant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleCardClick(applicant)}
              onMouseEnter={() => setHoveredApplicant(applicant.id)}
              onMouseLeave={() => setHoveredApplicant(null)}
              isHovered={hoveredApplicant === applicant.id}
            >
              <ApplicantHeaderBoard>
                <ApplicantInfoBoard>
                  <AiSuitabilityAvatarBoard percentage={applicant.aiSuitability}>
                    {applicant.aiSuitability}%
                  </AiSuitabilityAvatarBoard>
                  <ApplicantDetailsBoard>
                    <ApplicantNameBoard>{applicant.name}</ApplicantNameBoard>
                    <ApplicantPositionBoard>{applicant.position}</ApplicantPositionBoard>
                    <ApplicantContactBoard>
                      <ContactItem>
                        <FiMail size={10} />
                        {applicant.email}
                      </ContactItem>
                      <ContactItem>
                        <FiPhone size={10} />
                        {applicant.phone}
                      </ContactItem>
                    </ApplicantContactBoard>
                    <ApplicantSkillsBoard>
                      {applicant.skills.slice(0, 3).map((skill, skillIndex) => (
                        <SkillTagBoard key={skillIndex}>
                          {skill}
                        </SkillTagBoard>
                      ))}
                      {applicant.skills.length > 3 && (
                        <SkillTagBoard>+{applicant.skills.length - 3}</SkillTagBoard>
                      )}
                    </ApplicantSkillsBoard>
                    <ApplicantDateBoard>{applicant.appliedDate}</ApplicantDateBoard>
                  </ApplicantDetailsBoard>
                </ApplicantInfoBoard>
                <ApplicantRanksBoard>
                  <RankItem>
                    <span>이력서</span>
                    <RankBadge rank={applicant.ranks?.resume || 0}>
                      {applicant.ranks?.resume || 0}
                    </RankBadge>
                  </RankItem>
                  <RankItem>
                    <span>자소서</span>
                    <RankBadge rank={applicant.ranks?.coverLetter || 0}>
                      {applicant.ranks?.coverLetter || 0}
                    </RankBadge>
                  </RankItem>
                  <RankItem>
                    <span>포폴</span>
                    <RankBadge rank={applicant.ranks?.portfolio || 0}>
                      {applicant.ranks?.portfolio || 0}
                    </RankBadge>
                  </RankItem>
                  <RankItem>
                    <span>총점</span>
                    <RankBadge rank={applicant.ranks?.total || 0}>
                      {applicant.ranks?.total || 0}
                    </RankBadge>
                  </RankItem>
                </ApplicantRanksBoard>
                {applicant.status !== '지원' && (
                  <StatusColumnWrapper>
                    <StatusBadge status={applicant.status}>
                      {applicant.status}
                    </StatusBadge>
                  </StatusColumnWrapper>
                )}
              </ApplicantHeaderBoard>
              
              <ApplicantActionsBoard isHovered={hoveredApplicant === applicant.id}>
                <PassButton onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(applicant.id, '합격');
                }}>
                  <FiCheck size={12} />
                  합격
                </PassButton>
                <PendingButton onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(applicant.id, '보류');
                }}>
                  <FiClock size={12} />
                  보류
                </PendingButton>
                <RejectButton onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(applicant.id, '불합격');
                }}>
                  <FiX size={12} />
                  불합격
                </RejectButton>
              </ApplicantActionsBoard>
            </ApplicantCardBoard>
          ))}
        </ApplicantsBoard>
      )}

      {filteredApplicants.length === 0 && (
        <EmptyState>
          <FiUser size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3>지원자가 없습니다</h3>
          <p>검색 조건을 변경하거나 새로운 지원자를 기다려보세요.</p>
        </EmptyState>
      )}

      {/* 지원자 상세 모달 */}
      <AnimatePresence>
        {isModalOpen && selectedApplicant && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>지원자 상세 정보</ModalTitle>
                <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
              </ModalHeader>

              <ProfileSection>
                <SectionTitle>
                  <FiUser size={20} />
                  기본 정보
                </SectionTitle>
                <ProfileGrid>
                  <ProfileItem>
                    <ProfileLabel>이름</ProfileLabel>
                    <ProfileValue>{selectedApplicant.name}</ProfileValue>
                  </ProfileItem>
                  <ProfileItem>
                    <ProfileLabel>경력</ProfileLabel>
                    <ProfileValue>{selectedApplicant.experience}</ProfileValue>
                  </ProfileItem>
                  <ProfileItem>
                    <ProfileLabel>희망부서</ProfileLabel>
                    <ProfileValue>{selectedApplicant.department}</ProfileValue>
                  </ProfileItem>
                  <ProfileItem>
                    <ProfileLabel>희망직책</ProfileLabel>
                    <ProfileValue>{selectedApplicant.position}</ProfileValue>
                  </ProfileItem>
                </ProfileGrid>
              </ProfileSection>

              <SkillsSection>
                <SkillsTitle>
                  <FiCode size={20} />
                  기술스택
                </SkillsTitle>
                <SkillsGrid>
                  {selectedApplicant.skills.map((skill, index) => (
                    <SkillTag key={index}>
                      {skill}
                    </SkillTag>
                  ))}
                </SkillsGrid>
              </SkillsSection>

              <SummarySection>
                <SummaryTitle>
                  <FiFile size={20} />
                  AI 분석 요약
                </SummaryTitle>
                <SummaryText>
                  {selectedApplicant.summary}
                </SummaryText>
              </SummarySection>

              <DocumentButtons>
                <DocumentButton onClick={() => handleDocumentClick('resume', selectedApplicant)}>
                  <FiFileText size={16} />
                  이력서
                </DocumentButton>
                <DocumentButton onClick={() => handleDocumentClick('coverLetter', selectedApplicant)}>
                  <FiMessageSquare size={16} />
                  자소서
                </DocumentButton>
                <DocumentButton onClick={() => handleDocumentClick('portfolio', selectedApplicant)}>
                  <FiCode size={16} />
                  포트폴리오
                </DocumentButton>
              </DocumentButtons>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* 문서 모달 */}
      <AnimatePresence>
        {documentModal.isOpen && documentModal.applicant && (
          <DocumentModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDocumentModal}
          >
            <DocumentModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DocumentModalHeader>
                <DocumentModalTitle>
                  {documentModal.type === 'resume' && '이력서'}
                  {documentModal.type === 'coverLetter' && '자기소개서'}
                  {documentModal.type === 'portfolio' && '포트폴리오'}
                  - {documentModal.applicant.name}
                </DocumentModalTitle>
                <DocumentCloseButton onClick={handleCloseDocumentModal}>&times;</DocumentCloseButton>
              </DocumentModalHeader>

              <DocumentContent>
                {documentModal.type === 'resume' && documentModal.applicant.documents?.resume && (
                  <>
                    <DocumentSection>
                      <DocumentSectionTitle>개인정보</DocumentSectionTitle>
                      <DocumentGrid>
                        <DocumentCard>
                          <DocumentCardTitle>이름</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.personalInfo.name}</DocumentCardText>
                        </DocumentCard>
                        <DocumentCard>
                          <DocumentCardTitle>이메일</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.personalInfo.email}</DocumentCardText>
                        </DocumentCard>
                        <DocumentCard>
                          <DocumentCardTitle>연락처</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.personalInfo.phone}</DocumentCardText>
                        </DocumentCard>
                        <DocumentCard>
                          <DocumentCardTitle>주소</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.personalInfo.address}</DocumentCardText>
                        </DocumentCard>
                      </DocumentGrid>
                    </DocumentSection>

                    <DocumentSection>
                      <DocumentSectionTitle>학력사항</DocumentSectionTitle>
                      {documentModal.applicant.documents.resume.education.map((edu, index) => (
                        <DocumentCard key={index}>
                          <DocumentCardTitle>{edu.school}</DocumentCardTitle>
                          <DocumentCardText>{edu.major} ({edu.degree})</DocumentCardText>
                          <DocumentCardText>기간: {edu.period}</DocumentCardText>
                          <DocumentCardText>학점: {edu.gpa}</DocumentCardText>
                        </DocumentCard>
                      ))}
                    </DocumentSection>

                    <DocumentSection>
                      <DocumentSectionTitle>경력사항</DocumentSectionTitle>
                      {documentModal.applicant.documents.resume.experience.map((exp, index) => (
                        <DocumentCard key={index}>
                          <DocumentCardTitle>{exp.company} - {exp.position}</DocumentCardTitle>
                          <DocumentCardText>기간: {exp.period}</DocumentCardText>
                          <DocumentCardText>{exp.description}</DocumentCardText>
                        </DocumentCard>
                      ))}
                    </DocumentSection>

                    <DocumentSection>
                      <DocumentSectionTitle>기술스택</DocumentSectionTitle>
                      <DocumentGrid>
                        <DocumentCard>
                          <DocumentCardTitle>프로그래밍 언어</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.skills.programming.join(', ')}</DocumentCardText>
                        </DocumentCard>
                        <DocumentCard>
                          <DocumentCardTitle>개발 도구</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.skills.tools.join(', ')}</DocumentCardText>
                        </DocumentCard>
                        <DocumentCard>
                          <DocumentCardTitle>언어</DocumentCardTitle>
                          <DocumentCardText>{documentModal.applicant.documents.resume.skills.languages.join(', ')}</DocumentCardText>
                        </DocumentCard>
                      </DocumentGrid>
                    </DocumentSection>
                  </>
                )}

                {documentModal.type === 'coverLetter' && documentModal.applicant.documents?.coverLetter && (
                  <>
                    <DocumentSection>
                      <DocumentSectionTitle>지원 동기</DocumentSectionTitle>
                      <DocumentText>{documentModal.applicant.documents.coverLetter.motivation}</DocumentText>
                    </DocumentSection>

                    <DocumentSection>
                      <DocumentSectionTitle>나의 강점</DocumentSectionTitle>
                      <DocumentList>
                        {documentModal.applicant.documents.coverLetter.strengths.map((strength, index) => (
                          <DocumentListItem key={index}>{strength}</DocumentListItem>
                        ))}
                      </DocumentList>
                    </DocumentSection>

                    <DocumentSection>
                      <DocumentSectionTitle>향후 목표</DocumentSectionTitle>
                      <DocumentText>{documentModal.applicant.documents.coverLetter.goals}</DocumentText>
                    </DocumentSection>
                  </>
                )}

                {documentModal.type === 'portfolio' && documentModal.applicant.documents?.portfolio && (
                  <>
                    <DocumentSection>
                      <DocumentSectionTitle>프로젝트</DocumentSectionTitle>
                      {documentModal.applicant.documents.portfolio.projects.map((project, index) => (
                        <DocumentCard key={index}>
                          <DocumentCardTitle>{project.title}</DocumentCardTitle>
                          <DocumentCardText>{project.description}</DocumentCardText>
                          <DocumentCardText><strong>기술스택:</strong> {project.technologies.join(', ')}</DocumentCardText>
                          <DocumentCardText><strong>주요 기능:</strong></DocumentCardText>
                          <DocumentList>
                            {project.features.map((feature, idx) => (
                              <DocumentListItem key={idx}>{feature}</DocumentListItem>
                            ))}
                          </DocumentList>
                          <DocumentCardText><strong>GitHub:</strong> <a href={project.github} target="_blank" rel="noopener noreferrer">{project.github}</a></DocumentCardText>
                          <DocumentCardText><strong>Demo:</strong> <a href={project.demo} target="_blank" rel="noopener noreferrer">{project.demo}</a></DocumentCardText>
                        </DocumentCard>
                      ))}
                    </DocumentSection>

                    <DocumentSection>
                      <DocumentSectionTitle>성과 및 수상</DocumentSectionTitle>
                      <DocumentList>
                        {documentModal.applicant.documents.portfolio.achievements.map((achievement, index) => (
                          <DocumentListItem key={index}>{achievement}</DocumentListItem>
                        ))}
                      </DocumentList>
                    </DocumentSection>
                  </>
                )}
              </DocumentContent>
            </DocumentModalContent>
          </DocumentModalOverlay>
        )}
      </AnimatePresence>

      {/* 필터 모달 */}
      <AnimatePresence>
        {filterModal && (
          <FilterModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseFilterModal}
          >
            <FilterModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <FilterModalHeader>
                <FilterModalTitle>필터</FilterModalTitle>
                <FilterCloseButton onClick={handleCloseFilterModal}>&times;</FilterCloseButton>
              </FilterModalHeader>

              <FilterGrid>
                <FilterColumn>
                  <FilterSection>
                    <FilterSectionTitle>직무</FilterSectionTitle>
                    <CheckboxGroup>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('프론트엔드')}
                          onChange={() => handleJobChange('프론트엔드')}
                        />
                        프론트엔드
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('풀스택')}
                          onChange={() => handleJobChange('풀스택')}
                        />
                        풀스택
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('PM')}
                          onChange={() => handleJobChange('PM')}
                        />
                        PM
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('DevOps')}
                          onChange={() => handleJobChange('DevOps')}
                        />
                        DevOps
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('백엔드')}
                          onChange={() => handleJobChange('백엔드')}
                        />
                        백엔드
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('데이터 분석')}
                          onChange={() => handleJobChange('데이터 분석')}
                        />
                        데이터 분석
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('UI/UX')}
                          onChange={() => handleJobChange('UI/UX')}
                        />
                        UI/UX
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedJobs.includes('QA')}
                          onChange={() => handleJobChange('QA')}
                        />
                        QA
                      </CheckboxItem>
                    </CheckboxGroup>
                  </FilterSection>
                </FilterColumn>

                <FilterColumn>
                  <FilterSection>
                    <FilterSectionTitle>경력</FilterSectionTitle>
                    <CheckboxGroup>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedExperience.includes('신입')}
                          onChange={() => handleExperienceChange('신입')}
                        />
                        신입
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedExperience.includes('1-3년')}
                          onChange={() => handleExperienceChange('1-3년')}
                        />
                        1-3년
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedExperience.includes('3-5년')}
                          onChange={() => handleExperienceChange('3-5년')}
                        />
                        3-5년
                      </CheckboxItem>
                      <CheckboxItem>
                        <Checkbox
                          type="checkbox"
                          checked={selectedExperience.includes('5년이상')}
                          onChange={() => handleExperienceChange('5년이상')}
                        />
                        5년이상
                      </CheckboxItem>
                    </CheckboxGroup>
                  </FilterSection>
                </FilterColumn>
              </FilterGrid>

              <ApplyButton onClick={handleApplyFilter}>
                적용
              </ApplyButton>
            </FilterModalContent>
          </FilterModalOverlay>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default ApplicantManagement; 