import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TalentService = {
  // 모든 인재 조회
  getAllTalents: async () => {
    try {
      const response = await api.get('/talents');
      return response.data;
    } catch (error) {
      console.error('Error fetching talents:', error);
      throw error;
    }
  },

  // 인재 등록
  createTalent: async (talentData) => {
    try {
      const response = await api.post('/talents', talentData);
      return response.data;
    } catch (error) {
      console.error('Error creating talent:', error);
      throw error;
    }
  },

  // 특정 인재 조회
  getTalent: async (talentId) => {
    try {
      const response = await api.get(`/talents/${talentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching talent:', error);
      throw error;
    }
  },

  // 인재 정보 수정
  updateTalent: async (talentId, talentData) => {
    try {
      const response = await api.put(`/talents/${talentId}`, talentData);
      return response.data;
    } catch (error) {
      console.error('Error updating talent:', error);
      throw error;
    }
  },

  // 인재 삭제
  deleteTalent: async (talentId) => {
    try {
      const response = await api.delete(`/talents/${talentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting talent:', error);
      throw error;
    }
  }
};

export default TalentService;