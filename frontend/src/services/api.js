import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const fluxoService = {
  listar: () => api.get('/fluxos'),
  obter: (id) => api.get(`/fluxos/${id}`),
  criar: (data) => api.post('/fluxos', data),
  atualizar: (id, data) => api.put(`/fluxos/${id}`, data),
  deletar: (id) => api.delete(`/fluxos/${id}`),
  duplicar: (id) => api.post(`/fluxos/${id}/duplicar`),
};

export const numeroService = {
  listar: () => api.get('/numeros'),
  criar: (data) => api.post('/numeros', data),
  atualizar: (id, data) => api.put(`/numeros/${id}`, data),
  deletar: (id) => api.delete(`/numeros/${id}`),
};

export const conexaoService = {
  listar: () => api.get('/conexoes'),
  criar: (data) => api.post('/conexoes', data),
  status: (id) => api.get(`/conexoes/${id}/status`),
  atualizar: (id, data) => api.put(`/conexoes/${id}`, data),
  deletar: (id) => api.delete(`/conexoes/${id}`),
  logout: (id) => api.post(`/conexoes/${id}/logout`),
  reconectar: (id) => api.post(`/conexoes/${id}/reconectar`),
  verificarSenha: (id, senha) => api.post(`/conexoes/${id}/verificar-senha`, { senha }),
  contatos: (id) => api.get(`/conexoes/${id}/contatos`),
  fotoContato: (id, numero) => api.get(`/conexoes/${id}/foto-contato?numero=${numero}`),
};

export const mensagemAutoService = {
  listar: () => api.get('/mensagens-auto'),
  criar: (data) => api.post('/mensagens-auto', data),
  atualizar: (id, data) => api.put(`/mensagens-auto/${id}`, data),
  deletar: (id) => api.delete(`/mensagens-auto/${id}`),
  grupos: (conexaoId) => api.get(`/mensagens-auto/grupos/${conexaoId}`),
  enviar: (id) => api.post(`/mensagens-auto/${id}/enviar`),
};

export const mensagemIndividualService = {
  listar: () => api.get('/mensagens-individuais'),
  criar: (data) => api.post('/mensagens-individuais', data),
  atualizar: (id, data) => api.put(`/mensagens-individuais/${id}`, data),
  deletar: (id) => api.delete(`/mensagens-individuais/${id}`),
  enviar: (id) => api.post(`/mensagens-individuais/${id}/enviar`),
};

export default api;
