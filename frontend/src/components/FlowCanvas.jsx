import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls,
  addEdge, useNodesState, useEdgesState, ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StartNode from './nodes/StartNode';
import MessageNode from './nodes/MessageNode';
import MenuNode from './nodes/MenuNode';
import ImageNode from './nodes/ImageNode';
import VideoNode from './nodes/VideoNode';
import LinkNode from './nodes/LinkNode';
import TransferNode from './nodes/TransferNode';
import DelayNode from './nodes/DelayNode';
import NodeEditPanel from './NodeEditPanel';
import MensagensAutoPage from './MensagensAutoPage';
import { conexaoService } from '../services/api';

const nodeTypes = {
  startNode: StartNode,
  messageNode: MessageNode,
  menuNode: MenuNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  linkNode: LinkNode,
  transferNode: TransferNode,
  delayNode: DelayNode,
};

const defaultEdgeOptions = {
  type: 'default',
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
};

function FlowEditor({ fluxo, conexoes = [], onSalvar, onVoltar }) {
  const [abaAtiva, setAbaAtiva] = useState('fluxo');
  const [nodes, setNodes, onNodesChange] = useNodesState(fluxo?.mapa?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(fluxo?.mapa?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nome, setNome] = useState(fluxo?.nome || '');
  const [gatilhos, setGatilhos] = useState(fluxo?.gatilhos || '');
  const [conexaoId, setConexaoId] = useState(fluxo?.conexaoId || '');
  const [horarioInicio, setHorarioInicio] = useState(fluxo?.horarioInicio || '');
  const [horarioFim, setHorarioFim] = useState(fluxo?.horarioFim || '');
  const [msgForaHorario, setMsgForaHorario] = useState(fluxo?.msgForaHorario || '');
  const [mostrarConfig, setMostrarConfig] = useState(!fluxo?.id);
  const [mostrarAddMenu, setMostrarAddMenu] = useState(false);
  const [msgsConexaoId, setMsgsConexaoId] = useState(null);
  const [msgsConexaoNome, setMsgsConexaoNome] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [senhaErro, setSenhaErro] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // --- Undo/Redo ---
  const historyRef = useRef([{ nodes: fluxo?.mapa?.nodes || [], edges: fluxo?.mapa?.edges || [] }]);
  const historyIndexRef = useRef(0);
  const skipSaveRef = useRef(false);

  const saveHistory = useCallback(() => {
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    setNodes((currentNodes) => {
      setEdges((currentEdges) => {
        const snap = { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) };
        const idx = historyIndexRef.current;
        historyRef.current = historyRef.current.slice(0, idx + 1);
        historyRef.current.push(snap);
        if (historyRef.current.length > 50) historyRef.current.shift();
        historyIndexRef.current = historyRef.current.length - 1;
        return currentEdges;
      });
      return currentNodes;
    });
  }, [setNodes, setEdges]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snap = historyRef.current[historyIndexRef.current];
    skipSaveRef.current = true;
    setNodes(JSON.parse(JSON.stringify(snap.nodes)));
    setEdges(JSON.parse(JSON.stringify(snap.edges)));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    skipSaveRef.current = true;
    setNodes(JSON.parse(JSON.stringify(snap.nodes)));
    setEdges(JSON.parse(JSON.stringify(snap.edges)));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } }, eds));
    setTimeout(saveHistory, 0);
  }, [setEdges, saveHistory]);

  const onNodeClick = useCallback((_, node) => {
    if (node.type !== 'startNode') setSelectedNode(node);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Desconectar Ligação',
      message: 'Tem certeza que deseja desconectar esta linha de ligação?',
      onConfirm: () => {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        setTimeout(saveHistory, 0);
      }
    });
  }, [setEdges, saveHistory]);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onNodeChange = useCallback((updatedNode) => {
    setNodes((nds) => nds.map((n) => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNode(updatedNode);
    setTimeout(saveHistory, 0);
  }, [setNodes, saveHistory]);

  const createNodeData = (type) => {
    switch (type) {
      case 'messageNode': return { text: '' };
      case 'menuNode': return { text: 'Escolha:', opcoes: [{ id: 'opt_' + Date.now() + '_1', numero: '1', label: 'Opcao 1' }, { id: 'opt_' + Date.now() + '_2', numero: '2', label: 'Opcao 2' }] };
      case 'imageNode': return { url: '', caption: '' };
      case 'videoNode': return { url: '', caption: '' };
      case 'linkNode': return { text: '', url: '' };
      case 'transferNode': return { text: 'Vou te transferir para nossa equipe!', numero: '556199999999' };
      case 'delayNode': return { seconds: 2 };
      default: return {};
    }
  };

  const addNode = (type) => {
    const id = type.replace('Node', '') + '_' + Date.now();
    setNodes((nds) => [...nds, {
      id, type,
      position: { x: 250 + Math.random() * 100, y: 200 + Math.random() * 200 },
      data: createNodeData(type),
    }]);
    setTimeout(saveHistory, 0);
  };

  const addNodeFrom = useCallback((sourceNode, type) => {
    const id = type.replace('Node', '') + '_' + Date.now();

    // Descobre quais handles de saída já estão ocupados
    setEdges((currentEdges) => {
      const handlesOcupados = currentEdges
        .filter((e) => e.source === sourceNode.id)
        .map((e) => e.sourceHandle || 'bottom');

      // Ordem de preferência: bottom, right, left
      const handlesPossiveis = ['bottom', 'right', 'left'];
      const handleLivre = handlesPossiveis.find((h) => !handlesOcupados.includes(h)) || 'right';

      // Posição baseada no handle escolhido
      let pos;
      if (handleLivre === 'right') {
        pos = { x: sourceNode.position.x + 320, y: sourceNode.position.y };
      } else if (handleLivre === 'left') {
        pos = { x: sourceNode.position.x - 320, y: sourceNode.position.y };
      } else {
        pos = { x: sourceNode.position.x, y: sourceNode.position.y + 200 };
      }

      // Handle de entrada do novo node
      const targetHandle = handleLivre === 'right' ? 'left' : handleLivre === 'left' ? 'right' : 'top';

      const newNode = { id, type, position: pos, data: createNodeData(type) };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNode(newNode);

      return [...currentEdges, {
        id: 'e_' + Date.now(),
        source: sourceNode.id,
        sourceHandle: handleLivre,
        target: id,
        targetHandle,
        type: 'default',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      }];
    });

    setTimeout(saveHistory, 0);
  }, [setNodes, setEdges, saveHistory]);

  const deleteSelected = () => {
    if (!selectedNode || selectedNode.type === 'startNode') return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setTimeout(saveHistory, 0);
  };

  const handleSalvar = () => {
    if (!nome.trim() || !gatilhos.trim()) { setMostrarConfig(true); return; }
    onSalvar({
      nome: nome.trim(), gatilhos: gatilhos.trim(),
      conexaoId: conexaoId ? parseInt(conexaoId) : null,
      horarioInicio: horarioInicio || null, horarioFim: horarioFim || null,
      msgForaHorario: msgForaHorario || null,
      mapa: { nodes, edges },
    });
  };

  // Nome da conexao selecionada
  const conexaoSelecionada = conexoes.find((c) => String(c.id) === String(conexaoId));

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Toolbar */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 flex items-center justify-between z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={onVoltar} 
            className="w-8 h-8 rounded-lg hover:bg-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
            title="Voltar para a lista"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <div className="w-px h-5 bg-[var(--border)] shrink-0" />
          
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[14px] font-extrabold text-[var(--text-primary)] tracking-tight truncate max-w-[180px] font-display">
              {nome || 'Novo Fluxo'}
            </span>
            {conexaoSelecionada && (
              <span className="badge badge-neutral text-[10px] font-extrabold px-2 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-secondary)]">
                📞 {conexaoSelecionada.apelido || conexaoSelecionada.nome}
              </span>
            )}
            {/* Cog Settings Button */}
            <button 
              onClick={() => setMostrarConfig(!mostrarConfig)} 
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                mostrarConfig 
                  ? 'bg-[#F40009]/10 text-[#F40009] border-[#F40009]/20' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] border-transparent'
              }`}
              title="Configurações do Fluxo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          <div className="w-px h-5 bg-[var(--border)] shrink-0" />

          {/* Abas */}
          <div className="flex bg-[var(--surface-sunken)] rounded-lg p-[3px] border border-[var(--border)] shrink-0">
            <button
              onClick={() => setAbaAtiva('fluxo')}
              className={`text-xs px-4 py-1.5 rounded-md cursor-pointer transition-all font-bold ${
                abaAtiva === 'fluxo' 
                  ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs border border-[var(--border)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Fluxo
            </button>
            <button
              onClick={() => setAbaAtiva('automaticas')}
              className={`text-xs px-4 py-1.5 rounded-md cursor-pointer transition-all font-bold ${
                abaAtiva === 'automaticas' 
                  ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs border border-[var(--border)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Msgs Auto
            </button>
          </div>
        </div>

        {abaAtiva === 'fluxo' && (
          <div className="flex items-center gap-2.5">
            {/* Undo/Redo Group */}
            <div className="flex items-center bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg p-0.5">
              <button 
                onClick={undo} 
                title="Desfazer (Ctrl+Z)" 
                className="w-7 h-7 rounded-md hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
              <button 
                onClick={redo} 
                title="Refazer (Ctrl+Y)" 
                className="w-7 h-7 rounded-md hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                </svg>
              </button>
            </div>
            
            <div className="w-px h-5 bg-[var(--border)] shrink-0" />

            {/* Dropdown Adicionar */}
            <div className="relative">
              <button 
                onClick={() => setMostrarAddMenu(!mostrarAddMenu)} 
                className="btn btn-dark btn-sm py-2.5 px-4 text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adicionar Bloco
              </button>
              {mostrarAddMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMostrarAddMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] rounded-xl py-1.5 w-48 z-40 animate-fadeInScale border border-[var(--border)] shadow-md">
                    <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider px-3.5 py-1">Tipos de Bloco</p>
                    {[
                      { type: 'messageNode', label: 'Mensagem', color: '#2563eb' },
                      { type: 'menuNode', label: 'Menu de Opções', color: '#d97706' },
                      { type: 'imageNode', label: 'Imagem', color: '#7c3aed' },
                      { type: 'videoNode', label: 'Vídeo', color: '#db2777' },
                      { type: 'linkNode', label: 'Link Web', color: '#0891b2' },
                      { type: 'transferNode', label: 'Transferir Setor', color: '#059669' },
                      { type: 'delayNode', label: 'Aguardar / Delay', color: '#ea580c' },
                    ].map(({ type, label, color }) => (
                      <button 
                        key={type} 
                        onClick={() => { addNode(type); setMostrarAddMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors text-left font-semibold rounded-lg mx-0.5" 
                        style={{ width: 'calc(100% - 4px)' }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }} />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedNode && selectedNode.type !== 'startNode' && (
              <button 
                onClick={deleteSelected} 
                className="btn btn-danger btn-sm text-rose-600 font-bold px-3 hover:bg-rose-50 flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-100 rounded-lg py-1.5"
                title="Excluir bloco selecionado"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Excluir
              </button>
            )}
            
            <div className="w-px h-5 bg-[var(--border)] shrink-0" />
            
            <button 
              onClick={handleSalvar} 
              className="btn btn-primary btn-md py-2.5 px-5 text-xs font-bold shadow-sm"
            >
              Salvar Fluxo
            </button>
          </div>
        )}
      </div>

      {/* Aba: Fluxo de Mensagem */}
      {abaAtiva === 'fluxo' && (
        <>
          {/* Config */}
          {mostrarConfig && (
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-8 py-5 z-30 animate-slideDown shadow-xs relative">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F40009]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Parâmetros Globais do Fluxo</h3>
                  </div>
                  <button onClick={() => setMostrarConfig(false)} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[#F40009] cursor-pointer flex items-center gap-1 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Fechar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Sub-grid esquerda para parâmetros (span 3) */}
                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 flex flex-col">
                      <label className="label">Nome do Fluxo</label>
                      <input 
                        value={nome} 
                        onChange={(e) => setNome(e.target.value)} 
                        placeholder="Ex: Boas-vindas" 
                        className="input py-2 px-3 text-xs" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="label">Canal Associado</label>
                      <select 
                        value={conexaoId} 
                        onChange={(e) => setConexaoId(e.target.value)} 
                        className="input py-2 px-3 text-xs cursor-pointer font-bold appearance-none bg-[var(--surface-sunken)]"
                      >
                        <option value="">Selecione...</option>
                        {conexoes.map((c) => (
                          <option key={c.id} value={c.id}>
                            📞 {c.apelido || c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex flex-col">
                      <label className="label">Palavras Gatilho</label>
                      <input 
                        value={gatilhos} 
                        onChange={(e) => setGatilhos(e.target.value)} 
                        placeholder="Ex: oi, olá, menu" 
                        className="input py-2 px-3 text-xs font-mono font-bold" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="label">Horário de Atendimento</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="time" 
                          value={horarioInicio} 
                          onChange={(e) => setHorarioInicio(e.target.value)} 
                          className="input py-2 px-2 text-xs flex-1 text-center font-bold" 
                        />
                        <span className="text-[var(--text-muted)] text-xs">—</span>
                        <input 
                          type="time" 
                          value={horarioFim} 
                          onChange={(e) => setHorarioFim(e.target.value)} 
                          className="input py-2 px-2 text-xs flex-1 text-center font-bold" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Campo direita para resposta longa (span 2) */}
                  <div className="md:col-span-2 flex flex-col h-full">
                    <label className="label">Resposta fora do horário de atendimento</label>
                    <textarea 
                      value={msgForaHorario} 
                      onChange={(e) => setMsgForaHorario(e.target.value)} 
                      placeholder="Ex: Olá! Estamos fora do horário de atendimento no momento..." 
                      rows={4}
                      className="input py-2.5 px-3 text-xs resize-none flex-1 h-full min-h-[90px]" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Canvas + Painel lateral */}
          <div className="flex-1 flex">
            <div className="flex-1">
              <ReactFlow
                nodes={nodes} edges={edges}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                onConnect={onConnect} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
                nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions}
                minZoom={0.02} maxZoom={4}
                fitView className="bg-slate-50" deleteKeyCode="Delete"
              >
                <Background color="#cbd5e1" gap={24} size={1.5} />
                <Controls className="!bg-white !border-slate-200 !rounded-xl !shadow-sm [&>button]:!bg-white [&>button]:!border-slate-200 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-50 [&>button:hover]:!text-slate-700" />
              </ReactFlow>
            </div>
            <NodeEditPanel node={selectedNode} onChange={onNodeChange} onClose={() => setSelectedNode(null)} onAddFrom={addNodeFrom} />
          </div>
        </>
      )}

      {/* Aba: Mensagens Automaticas */}
      {abaAtiva === 'automaticas' && (
        <div className="flex-1 flex">
          {autenticado && msgsConexaoId ? (
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <button onClick={() => { setAutenticado(false); setMsgsConexaoId(null); setSenhaInput(''); }} className="text-gray-500 hover:text-[#151515] text-xs cursor-pointer">← Voltar</button>
                <span className="text-sm text-[#151515] font-medium">{msgsConexaoNome}</span>
              </div>
              <MensagensAutoPage conexaoIdFixa={msgsConexaoId} conexaoNome={msgsConexaoNome} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto py-12 px-6">
                <h3 className="text-xl font-bold text-[#151515] mb-2">Mensagens Automaticas</h3>
                <p className="text-gray-500 text-sm mb-6">Selecione uma conexao para acessar as mensagens</p>

                <div className="space-y-3">
                  {conexoes.filter((c) => c.status?.connected).map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-[14px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[#151515] font-medium">{c.apelido || c.nome}</span>
                          <span className="text-xs text-gray-400">{c.status?.info?.wid?.user}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">Online</span>
                      </div>

                      {msgsConexaoId === c.id && !autenticado ? (
                        <div className="mt-2">
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={senhaInput}
                              onChange={(e) => { setSenhaInput(e.target.value); setSenhaErro(false); }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  try {
                                    await conexaoService.verificarSenha(c.id, senhaInput);
                                    setMsgsConexaoNome(c.apelido || c.nome);
                                    setAutenticado(true);
                                  } catch { setSenhaErro(true); }
                                }
                              }}
                              placeholder="Digite a senha"
                              autoFocus
                              className={`flex-1 bg-white border rounded-lg px-3 py-2 text-[#151515] text-sm focus:outline-none ${senhaErro ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#e41e26]'}`}
                            />
                            <button
                              onClick={async () => {
                                try {
                                  await conexaoService.verificarSenha(c.id, senhaInput);
                                  setMsgsConexaoNome(c.apelido || c.nome);
                                  setAutenticado(true);
                                } catch { setSenhaErro(true); }
                              }}
                              className="bg-[#e41e26] hover:bg-[#c61a21] text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Entrar
                            </button>
                          </div>
                          {senhaErro && <p className="text-red-500 text-xs mt-1">Senha incorreta</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!c.senha) {
                              setMsgsConexaoId(c.id);
                              setMsgsConexaoNome(c.apelido || c.nome);
                              setAutenticado(true);
                            } else {
                              setMsgsConexaoId(c.id);
                              setSenhaInput('');
                              setSenhaErro(false);
                            }
                          }}
                          className="mt-2 w-full text-center text-xs text-[#e41e26] hover:text-[#c61a21] py-2 border border-[#e41e26]/15 rounded-lg cursor-pointer hover:bg-[#e41e26]/5 transition-colors"
                        >
                          {c.senha ? 'Acessar (requer senha)' : 'Acessar mensagens'}
                        </button>
                      )}
                    </div>
                  ))}

                  {conexoes.filter((c) => c.status?.connected).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhuma conexao online</p>
                      <p className="text-gray-400 text-sm mt-1">Conecte um WhatsApp na pagina de Conexoes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modal de Confirmação customizado (Estilo Brasal) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInScale">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6">{confirmModal.message}</p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="btn btn-ghost btn-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                className="btn btn-primary btn-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowCanvas({ fluxo, conexoes, onSalvar, onVoltar }) {
  return <ReactFlowProvider><FlowEditor fluxo={fluxo} conexoes={conexoes} onSalvar={onSalvar} onVoltar={onVoltar} /></ReactFlowProvider>;
}
