/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Mail, 
  FileText, 
  Folder, 
  CheckSquare, 
  Settings, 
  Globe,
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Send, 
  PlusCircle, 
  X,
  FileSpreadsheet, 
  PlusSquare,
  Search,
  Check,
  AlertCircle,
  Clock,
  User,
  Info,
  Download,
  Upload
} from 'lucide-react';
import { Product, Sale, Client } from '../types';

interface GoogleWorkspaceProps {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  activeSubTab?: 'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config';
  setActiveSubTab?: (subTab: 'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config') => void;
}

interface GoogleProfile {
  name: string;
  email: string;
  picture: string;
}

export default function GoogleWorkspace({ 
  products, 
  sales, 
  clients,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}: GoogleWorkspaceProps) {
  // Current active sub-tab: 'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config'
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'agenda' | 'tarefas' | 'docs' | 'gmail' | 'sheets' | 'drive' | 'config'>('config');
  const activeSubTab = propActiveSubTab || internalActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setInternalActiveSubTab;

  // OAuth Setup States
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [hasSecret, setHasSecret] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  // Auth/Token States
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<GoogleProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Unified Loading and Alert messages
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time integration API data states
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [taskList, setTaskList] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  // Agenda Event model form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('10:00');
  const [eventEndTime, setEventEndTime] = useState('11:00');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Tasks model form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Docs model form state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // Gmail model form state
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('invite'); // 'invite' | 'receipt' | 'coupon'
  const [emailClientSelect, setEmailClientSelect] = useState('');

  // Sheets model form state
  const [sheetExportType, setSheetExportType] = useState<'products' | 'sales'>('products');
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);

  // File upload state for Drive
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileContent, setUploadFileContent] = useState('');
  const [uploadFileType, setUploadFileType] = useState('text/plain');
  const [isUploading, setIsUploading] = useState(false);

  // Load active configurations on mount
  useEffect(() => {
    fetchConfigs();
    
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    setEventDate(today);
    setNewTaskDueDate(today);
  }, []);

  // Listen to OAuth success postMessages from popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin to avoid security issues
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const payload = event.data.payload;
        if (payload?.accessToken) {
          setAccessToken(payload.accessToken);
          setUserProfile(payload.userProfile);
          setAuthError(null);
          setSuccessMsg(`Google Workspace conectado com sucesso como ${payload.userProfile?.email || 'usuário'}!`);
          setActiveSubTab('agenda'); // Shift to Agenda tab once connected
          
          // Trigger fetching of workspace data
          fetchCalendarEvents(payload.accessToken);
          fetchTasks(payload.accessToken);
          fetchDriveFiles(payload.accessToken);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Alert dismisser
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Fetch configs from the Node server
  const fetchConfigs = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/auth/google/config');
      const data = await res.json();
      if (data.success) {
        setClientId(data.clientId || '');
        setHasSecret(data.hasClientSecret);
        if (data.redirectUriDev) {
          setRedirectUri(data.redirectUriDev);
        } else {
          // Construct default callback URL relative to current host
          const devUrl = `${window.location.origin}/api/auth/google/callback`;
          setRedirectUri(devUrl);
        }
      }
    } catch (e) {
      console.error('Error fetching google workspace config:', e);
    } finally {
      setConfigLoading(false);
    }
  };

  // Save changes to the Node server
  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    try {
      const response = await fetch('/api/auth/google/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientSecret: clientSecret || undefined, // send only if updated
          redirectUriDev: redirectUri,
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Configurações salvas! Agora você pode conectar sua conta Google.');
        setHasSecret(true);
        setClientSecret('');
      } else {
        setErrorMsg(data.error || 'Falha ao salvar configurações.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro de rede: ${err.message}`);
    } finally {
      setIsConfigSaving(false);
    }
  };

  // Open the manual Google Authorization Dialog (OAuth Popup)
  const handleConnectAccount = async () => {
    setAuthError(null);
    try {
      // Fetch Google OAuth URL from the server
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Falha ao obter URL de autenticação.');
      }

      // Open popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        data.url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );

      if (!authWindow) {
        setAuthError('Bloqueador de popups ativo! Ative popups para este site para continuar.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao iniciar fluxo OAuth.');
    }
  };

  // Disconnect active Google account (In-memory token clearance)
  const handleDisconnect = () => {
    setAccessToken(null);
    setUserProfile(null);
    setCalendarEvents([]);
    setTaskList([]);
    setDriveFiles([]);
    setRecentDocs([]);
    setSuccessMsg('Sessão do Google Workspace encerrada com segurança.');
  };

  // --- API INTEGRATION GETTERS ---

  // Google Calendar Integration API calls
  const fetchCalendarEvents = async (token = accessToken) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendarId}/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.items || []);
      } else {
        const err = await res.json();
        if (err.error?.status === 'UNAUTHENTICATED') handleDisconnect();
        console.error('Error fetching calendar events:', err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Tasks Integration API calls
  const fetchTasks = async (token = accessToken) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@default/lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const listsData = await res.json();
        const primaryList = listsData.items?.[0]; // Get the first task list
        if (primaryList) {
          const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks?showCompleted=true&maxResults=12`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            // Store lists and tasklist items
            setTaskList(tasksData.items || []);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Drive & Recent Docs Integration API calls
  const fetchDriveFiles = async (token = accessToken) => {
    if (!token) return;
    setActionLoading(true);
    try {
      // Fetch files from Drive
      const dRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,size)', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        setDriveFiles(dData.files || []);
        
        // Filter out Google Docs and sort for the Recents component
        const docsOnly = dData.files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.document');
        setRecentDocs(docsOnly);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger quick manual refetch
  const handleSyncAll = () => {
    if (!accessToken) return;
    fetchCalendarEvents();
    fetchTasks();
    fetchDriveFiles();
    setSuccessMsg('Sincronização em tempo real realizada com sucesso!');
  };

  // --- MUTATING API OPERATIONS (WITH USER CONFIRMATIONS) ---

  // Google Agenda: Add Event
  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    const startStr = `${eventDate}T${eventStartTime}:00`;
    const endStr = `${eventDate}T${eventEndTime}:00`;

    // Explicit confirmation constraint checked
    const confirmed = window.confirm(`Deseja adicionar o evento "${eventTitle}" na sua agenda para o dia ${eventDate} às ${eventStartTime}?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const eventBody = {
        summary: eventTitle,
        description: eventDesc,
        start: { dateTime: startStr, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endStr, timeZone: 'America/Sao_Paulo' }
      };

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendarId}/events`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });

      if (res.ok) {
        setSuccessMsg(`Evento "${eventTitle}" agendado com sucesso!`);
        setEventTitle('');
        setEventDesc('');
        setIsCreatingEvent(false);
        fetchCalendarEvents();
      } else {
        const error = await res.json();
        setErrorMsg(error.error?.message || 'Falha ao criar evento.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro de rede: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Agenda: Delete Event (destructive, demands confirmation)
  const handleDeleteCalendarEvent = async (eventId: string, title: string) => {
    if (!accessToken) return;

    // MANDATORY confirmation before deleting
    const confirmed = window.confirm(`AVISO: Tem certeza que deseja DELETAR o evento "${title}" da sua agenda Google? Esta ação é irreversível.`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (res.status === 204 || res.ok) {
        setSuccessMsg(`Evento "${title}" deletado com sucesso.`);
        fetchCalendarEvents();
      } else {
        setErrorMsg('Falha ao excluir o evento.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro de rede: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Tasks: Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    // Confirmation
    const confirmed = window.confirm(`Deseja adicionar a tarefa "${newTaskTitle}" no seu Google Tarefas?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // Get primary list first
      const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@default/lists', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const listsData = await listsRes.json();
      const primaryListId = listsData.items?.[0]?.id;

      if (!primaryListId) throw new Error('Lista de tarefas padrão não encontrada.');

      const rfcDueDate = newTaskDueDate ? `${newTaskDueDate}T00:00:00.000Z` : undefined;

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTaskTitle,
          notes: newTaskNotes,
          due: rfcDueDate
        })
      });

      if (res.ok) {
        setSuccessMsg(`Tarefa "${newTaskTitle}" criada com sucesso!`);
        setNewTaskTitle('');
        setNewTaskNotes('');
        setIsCreatingTask(false);
        fetchTasks();
      } else {
        const error = await res.json();
        setErrorMsg(error.error?.message || 'Falha ao criar tarefa.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro de rede: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Tasks: Update Complete Status
  const handleToggleTaskStatus = async (task: any) => {
    if (!accessToken) return;
    
    const isCompleted = task.status === 'completed';
    const newStatus = isCompleted ? 'needsAction' : 'completed';
    const actType = isCompleted ? 'desmarcar' : 'concluir';

    const confirmed = window.confirm(`Deseja ${actType} a tarefa "${task.title}"?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // Get primary list first
      const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@default/lists', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const listsData = await listsRes.json();
      const primaryListId = listsData.items?.[0]?.id;

      if (!primaryListId) throw new Error('Lista de tarefas não encontrada.');

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
          completed: newStatus === 'completed' ? new Date().toISOString() : null
        })
      });

      if (res.ok) {
        setSuccessMsg(`Tarefa atualizada para ${newStatus === 'completed' ? 'Concluída' : 'Pendente'}.`);
        fetchTasks();
      } else {
        setErrorMsg('Falha ao atualizar tarefa.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Tasks: Clean Task (delete)
  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!accessToken) return;

    const confirmed = window.confirm(`Tem certeza que deseja excluir永久mente a tarefa "${title}"?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@default/lists', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const listsData = await listsRes.json();
      const primaryListId = listsData.items?.[0]?.id;

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (res.status === 204 || res.ok) {
        setSuccessMsg('Tarefa excluída permanentemente.');
        fetchTasks();
      } else {
        setErrorMsg('Falha ao excluir tarefa.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Docs: Create a new doc
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const confirmed = window.confirm(`Deseja criar um documento Google Doc nomeado "${newDocTitle}"?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // 1. Create a blank Google Doc
      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newDocTitle
        })
      });

      const docObj = await createRes.json();
      if (!createRes.ok) {
        throw new Error(docObj.error?.message || 'Falha ao criar documento.');
      }

      // 2. Insert content/text into Google Doc if specified
      if (newDocContent) {
        await fetch(`https://docs.googleapis.com/v1/documents/${docObj.documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  endOfSectionRecital: { segmentId: '' },
                  text: newDocContent,
                  location: { index: 1 }
                }
              }
            ]
          })
        });
      }

      setSuccessMsg(`Documento "${newDocTitle}" criado com sucesso no seu Google Drive!`);
      setNewDocTitle('');
      setNewDocContent('');
      setIsCreatingDoc(false);
      fetchDriveFiles();
    } catch (err: any) {
      setErrorMsg(`Erro ao criar documento: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Google Drive: Upload file
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!uploadFileName) {
      alert('Por favor informe o nome do arquivo.');
      return;
    }

    const confirmed = window.confirm(`Deseja carregar o arquivo "${uploadFileName}" para a sua conta do Google Drive?`);
    if (!confirmed) return;

    setIsUploading(true);
    try {
      const metadata = {
        name: uploadFileName,
        mimeType: uploadFileType
      };

      // Construct a simple multipart body format for media upload REST API
      const boundary = 'foo_bar_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${uploadFileType}\r\n\r\n` +
        uploadFileContent +
        closeDelimiter;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: multipartBody
      });

      if (res.ok) {
        const file = await res.json();
        setSuccessMsg(`Arquivo "${uploadFileName}" enviado com sucesso! (ID: ${file.id})`);
        setUploadFileName('');
        setUploadFileContent('');
        fetchDriveFiles();
      } else {
        const err = await res.json();
        setErrorMsg(err.error?.message || 'Erro ao enviar arquivo.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro no envio: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Google Drive: Delete file (destructive)
  const handleDeleteFile = async (fileId: string, name: string) => {
    if (!accessToken) return;

    const confirmed = window.confirm(`ATENÇÃO DESTRUTIVA: Tem certeza absoluta que deseja EXCLUIR permanentemente o arquivo "${name}" do seu Google Drive?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (res.status === 204 || res.ok) {
        setSuccessMsg(`Arquivo "${name}" foi excluído com sucesso.`);
        fetchDriveFiles();
      } else {
        setErrorMsg('Falha ao excluir o arquivo do Google Drive.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Gmail: Send email on behalf of user (mutates state, needs confirmation)
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!emailTo || !emailSubject || !emailBody) {
      alert('Por favor, preencha o destinatário, o assunto e o corpo do e-mail.');
      return;
    }

    const confirmed = window.confirm(`Deseja disparar este e-mail para "${emailTo}" pelo Gmail em seu nome?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // Build raw RFC 2822 message body and base64-encode it per Gmail API guidelines
      // Needs safe base64url encoding
      const base64EncodeUnicode = (str: string) => {
        return btoa(
          encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
          })
        );
      };

      const utf8Subject = `=?utf-8?B?${base64EncodeUnicode(emailSubject)}?=`;
      const emailContent = [
        `To: ${emailTo}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        emailBody
      ].join('\r\n');

      const encodedMessage = base64EncodeUnicode(emailContent)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedMessage
        })
      });

      if (res.ok) {
        setSuccessMsg(`E-mail enviado com sucesso para ${emailTo}!`);
        setEmailTo('');
        setEmailSubject('');
        setEmailBody('');
      } else {
        const error = await res.json();
        setErrorMsg(error.error?.message || 'Falha ao disparar e-mail.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro no envio do e-mail: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Gmail Template Auto filler
  const applyEmailTemplate = (templateName: string) => {
    setEmailTemplate(templateName);
    
    if (templateName === 'invite') {
      setEmailSubject('🌸 Convite VIP Reabertura - Nova Coleção AP Moda Fitness');
      setEmailBody(`
        <h2>Olá! Temos novidades maravilhosas para você! ✨</h2>
        <p>Como cliente VIP da <strong>AP Moda Fitness</strong>, gostaríamos de convidá-la em primeira mão para o lançamento da nossa nova coleção.</p>
        <p>São peças confeccionadas com tecidos de altíssima qualidade (Zero Transparência, fios de Poliamida premium com proteção UV50+ e modelagem empina-bumbum anatômica) para que você treine com extrema elegância e conforto absoluto.</p>
        <p>Venha nos fazer uma visita ou veja a vitrine online na nossa aba exclusiva!</p>
        <br />
        <p>Atenciosamente,<br /><strong>Equipe AP Moda Fitness</strong> 🌸💪</p>
      `);
    } else if (templateName === 'receipt') {
      // Pick the last sale if any
      const lastSale = sales[0];
      const itemsDetails = lastSale ? lastSale.items.map(it => `<li>${it.quantity}x ${it.name} - R$ ${it.price.toFixed(2)}</li>`).join('') : '<li>Conjunto Premium Fitness (Legging + Top Cropped)</li>';
      const totalCost = lastSale ? lastSale.total : 289.90;

      setEmailSubject(`🛍️ Seu Recibo Digital de Compra - AP Moda Fitness (Pedido #${lastSale ? lastSale.id.slice(0, 5).toUpperCase() : 'FIT908'})`);
      setEmailBody(`
        <h2>Obrigada pela compra na AP Moda Fitness! 🌸🛍️</h2>
        <p>Olá! Seu pedido foi faturado e já estamos preparando com todo o carinho para envio.</p>
        <p>Confira o resumo das suas peças selecionadas de alto padrão:</p>
        <ul>
          ${itemsDetails}
        </ul>
        <p><strong>Valor Total Pago:</strong> R$ ${totalCost.toFixed(2)}</p>
        <p>Em breve você receberá os códigos de rastreamento de entrega. Treine com estilo e poder! 💪🚀</p>
        <br />
        <p>Com todo o carinho,<br /><strong>AP Moda Fitness</strong> ✨</p>
      `);
    } else if (templateName === 'coupon') {
      setEmailSubject('🎁 Seu Cupom Exclusivo: 15% OFF nas Leggings Luxo!');
      setEmailBody(`
        <h2>Treine de look novo e economize! 🏋️‍♀️✨</h2>
        <p>Olá! Preparamos um presente especial para motivar seus treinos desta semana.</p>
        <p>Use o cupom <strong>FITNESS15</strong> e ganhe <strong>15% de Desconto Real + Frete Grátis</strong> em toda a linha de nobres leggings de alta compressão e tops confort-fit.</p>
        <p>Aproveite pois o estoque é limitado e esses tecidos nobres esgotam muito rápido!</p>
        <br />
        <p>Acesse nosso catálogo e escolha seu estilo!<br /><strong>AP Moda Fitness Corp.</strong> 🌸</p>
      `);
    }
  };

  // Google Sheets: Export products/sales data
  const handleExportToSheets = async () => {
    if (!accessToken) return;

    const confirmed = window.confirm(`Deseja criar uma nova Planilha Google e exportar o relatório de ${sheetExportType === 'products' ? 'Estoque de Produtos' : 'Histórico de Vendas'}?`);
    if (!confirmed) return;

    setActionLoading(true);
    setExportedSheetUrl(null);
    try {
      const sheetTitle = sheetExportType === 'products' 
        ? `AP Moda Fitness - Relatório de Estoque (${new Date().toLocaleDateString('pt-BR')})`
        : `AP Moda Fitness - Registro de Vendas Acumuladas (${new Date().toLocaleDateString('pt-BR')})`;

      // 1. Create a blank Spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: sheetTitle
          }
        })
      });

      const sheetObj = await createRes.json();
      if (!createRes.ok) throw new Error(sheetObj.error?.message || 'Falha ao criar planilha.');

      const spreadsheetId = sheetObj.spreadsheetId;

      // 2. Set up rows data
      let values: any[][] = [];
      if (sheetExportType === 'products') {
        values.push(['ID', 'Peça', 'SKU', 'Categoria', 'Preço de Venda (R$)', 'Custo Unitário (R$)', 'Em Estoque', 'Mínimo Seguro', 'Vendas Acumuladas']);
        products.forEach(p => {
          values.push([p.id, p.name, p.sku, p.category, p.price, p.cost, p.stock, p.minStock, p.salesCount]);
        });
      } else {
        values.push(['ID Venda', 'Cliente', 'CPF/Doc', 'Canal de Venda', 'Total Recebido (R$)', 'Status', 'Data']);
        sales.forEach(s => {
          values.push([s.id, s.clientName, s.clientDoc || 'Consumidor', s.channel, s.total, s.status, s.createdAt]);
        });
      }

      // 3. Write data to the Sheet
      const writeRange = 'Sheet1!A1';
      const writeResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: values
        })
      });

      if (writeResponse.ok) {
        const urlStr = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        setExportedSheetUrl(urlStr);
        setSuccessMsg(`Relatório de ${sheetExportType === 'products' ? 'Produtos' : 'Vendas'} exportado com sucesso para a Planilha Google!`);
      } else {
        const err = await writeResponse.json();
        throw new Error(err.error?.message || 'Erro ao preencher dados de linhas.');
      }
    } catch (err: any) {
      setErrorMsg(`Erro de exportação: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to handle client dropdown selection and autofill email address
  const handleClientEmailSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idxStr = e.target.value;
    setEmailClientSelect(idxStr);
    if (idxStr !== '') {
      const selectedClient = clients[Number(idxStr)];
      if (selectedClient) {
        setEmailTo(selectedClient.email || '');
      }
    }
  };

  // Format creation datetime nicely
  const formatTimeStr = (isoStr: string) => {
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" id="google-workspace-root">
      {/* Header section with profile status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md shadow-pink-500/20">
            GW
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              Microsoft Google Workspace <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Ativo</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Controlador central integrador de serviços em nuvem para escritório da AP Moda Fitness</p>
          </div>
        </div>

        {/* Sync or Connect actions */}
        <div className="flex items-center gap-2.5">
          {accessToken ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                {userProfile?.picture ? (
                  <img src={userProfile.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-pink-500" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold font-mono">G</div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold leading-none">{userProfile?.name}</div>
                  <div className="text-[9px] text-slate-500 leading-none mt-1 font-mono">{userProfile?.email}</div>
                </div>
              </div>
              <button 
                onClick={handleSyncAll}
                disabled={actionLoading}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border-0 rounded-xl transition-all hover:shadow-md cursor-pointer flex items-center justify-center"
                title="Sincronizar dados globais em tempo real"
              >
                <RefreshCw size={16} className={`${actionLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleDisconnect}
                className="py-1.5 px-3 bg-red-600/15 text-red-400 hover:bg-red-600/20 active:scale-95 text-xs font-bold rounded-xl border border-red-500/30 transition-all cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnectAccount}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-emerald-990/40 tracking-wider flex items-center gap-2 transition-all cursor-pointer animate-pulse"
            >
              <Globe size={14} className="text-white" />
              <span>CONECTAR CONTA GOOGLE 🌸</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Status and Alert feedback cards */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl flex items-start gap-3 text-emerald-400 text-xs animate-fade-in font-sans">
          <Check size={16} className="shrink-0 mt-0.5 text-emerald-400" />
          <div className="font-medium">{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-400/25 p-4 rounded-xl flex items-start gap-4 text-red-400 text-xs animate-fade-in font-sans">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
          <div className="font-semibold">{errorMsg}</div>
        </div>
      )}
      {authError && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl flex items-start gap-3 text-amber-400 text-xs font-sans">
          <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="font-medium">{authError}</div>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none gap-1 bg-white p-1 rounded-xl shadow-xs">
        {[
          { id: 'agenda', label: 'Agenda', icon: Calendar, needsAuth: true },
          { id: 'tarefas', label: 'Google Tarefas', icon: CheckSquare, needsAuth: true },
          { id: 'docs', label: 'Google Docs', icon: FileText, needsAuth: true },
          { id: 'gmail', label: 'Gmail', icon: Mail, needsAuth: true },
          { id: 'sheets', label: 'Planilhas Google', icon: FileSpreadsheet, needsAuth: true },
          { id: 'drive', label: 'Google Drive', icon: Folder, needsAuth: true },
          { id: 'config', label: 'Configurar OAuth', icon: Settings, needsAuth: false }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const isDisabled = tab.needsAuth && !accessToken;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              disabled={isDisabled}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border-0
                ${isActive 
                  ? 'bg-pink-600 text-white shadow-sm font-black' 
                  : isDisabled 
                    ? 'text-slate-350 cursor-not-allowed opacity-50 bg-slate-50' 
                    : 'text-slate-550 hover:bg-slate-100 hover:text-slate-800'
                }`}
              title={isDisabled ? 'Conecte sua conta do Google para liberar esta aba.' : ''}
            >
              <tab.icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content views according to active sub-tab */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 min-h-[350px]">
        
        {/* TAB 1: CALENDAR/AGENDA */}
        {activeSubTab === 'agenda' && accessToken && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Calendar size={18} className="text-pink-600" />
                  Compromissos do Google Agenda
                </h2>
                <p className="text-xs text-slate-500 mt-1">Lançamento de coleções, eventos com influencers, follow-ups e reuniões da equipe da AP Moda Fitness</p>
              </div>
              <button
                onClick={() => setIsCreatingEvent(!isCreatingEvent)}
                className="py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-pink-500/20 border-none cursor-pointer"
              >
                {isCreatingEvent ? <X size={14} /> : <Plus size={14} />}
                <span>{isCreatingEvent ? 'Fechar Formulário' : 'Marcar Compromisso'}</span>
              </button>
            </div>

            {/* Event insertion form */}
            {isCreatingEvent && (
              <form onSubmit={handleAddCalendarEvent} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4 animate-fade-in">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase uppercase">Novo Compromisso</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Título do Evento</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Lançamento Calças No-Limit Emana"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Data</label>
                    <input 
                      type="date" 
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Horário de Início</label>
                    <input 
                      type="time" 
                      required
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Horário de Término</label>
                    <input 
                      type="time" 
                      required
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Detalhes / Descrição</label>
                    <textarea 
                      placeholder="Ex: Sessão fotográfica com parceiras de Instagram usando looks Cirrê Brilho da AP Moda Fitness..."
                      value={eventDesc}
                      rows={3}
                      onChange={(e) => setEventDesc(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                  >
                    <Plus size={13} />
                    <span>{actionLoading ? 'Processando...' : 'Confirmar e Agendar no Google'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of active calendar events */}
            {calendarEvents.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                <Calendar size={32} className="mx-auto text-slate-350" />
                <p className="text-slate-500 text-xs font-semibold">Nenhum compromisso marcado para os próximos dias.</p>
                <p className="text-[10px] text-slate-400">Adicione novas sessões de provador, metas e reuniões fiscais clicando no botão acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calendarEvents.map((ev) => {
                  const startDt = ev.start?.dateTime || ev.start?.date || '';
                  const endDt = ev.end?.dateTime || ev.end?.date || '';
                  
                  return (
                    <div key={ev.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex justify-between items-start group">
                      <div className="space-y-1.5 text-left pr-4">
                        <div className="font-extrabold text-sm text-slate-800">{ev.summary}</div>
                        {ev.description && <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{ev.description}</p>}
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] font-medium text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                            <Clock size={10} className="text-slate-400" />
                            Início: {formatTimeStr(startDt)}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                            <Clock size={10} className="text-slate-400" />
                            Fim: {formatTimeStr(endDt)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteCalendarEvent(ev.id, ev.summary)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-colors border-none cursor-pointer"
                        title="Deletar este evento do Google Agenda"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GOOGLE TASKS/TAREFAS */}
        {activeSubTab === 'tarefas' && accessToken && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <CheckSquare size={18} className="text-pink-600" />
                  Suas Tarefas do Google
                </h2>
                <p className="text-xs text-slate-500 mt-1">Lista de tarefas logísticas, compras com fornecedores, devoluções integradas de clientes, campanhas de Instagram</p>
              </div>
              <button
                onClick={() => setIsCreatingTask(!isCreatingTask)}
                className="py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-pink-500/20 border-none cursor-pointer"
              >
                {isCreatingTask ? <X size={14} /> : <Plus size={14} />}
                <span>{isCreatingTask ? 'Fechar Formulário' : 'Nova Tarefa'}</span>
              </button>
            </div>

            {/* Task insertion form */}
            {isCreatingTask && (
              <form onSubmit={handleAddTask} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4 animate-fade-in">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Adicionar Tarefa Diária</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Título da Tarefa</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Chamar costureira para alinhar novos tops de compressão"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Prazo / Vencimento</label>
                    <input 
                      type="date" 
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Detalhes / Notas</label>
                    <textarea 
                      placeholder="Ex: Detalhes de aviamentos, cores e grades S, M, L..."
                      value={newTaskNotes}
                      rows={2}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                  >
                    <Plus size={13} />
                    <span>{actionLoading ? 'Processando...' : 'Criar no Google Tarefas'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of active tasks */}
            {taskList.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                <CheckSquare size={32} className="mx-auto text-slate-350" />
                <p className="text-slate-500 text-xs font-semibold">Tudo em ordem! Nenhuma tarefa pendente.</p>
                <p className="text-[10px] text-slate-400 font-sans">Cadastre checklists operacionais clicando no botão acima para organizar suas ações.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {taskList.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div key={task.id} className={`p-3.5 border rounded-xl flex items-start gap-3.5 transition-all hover:bg-slate-50/50 ${isCompleted ? 'bg-slate-50/30 border-slate-200/50' : 'bg-white border-slate-100'}`}>
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer border-none
                          ${isCompleted 
                            ? 'bg-pink-600 border-pink-600 text-white shadow-sm' 
                            : 'border-slate-300 bg-white text-transparent hover:border-pink-500 hover:text-pink-600/30'
                          }`}
                      >
                        <Check size={12} className="stroke-[3]" />
                      </button>
                      
                      <div className="flex-1 text-left">
                        <div className={`text-xs font-bold ${isCompleted ? 'text-slate-460 line-through' : 'text-slate-800'}`}>{task.title}</div>
                        {task.notes && <p className="text-slate-500 text-[11px] mt-1 pr-6 leading-relaxed">{task.notes}</p>}
                        {task.due && (
                          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mt-1 flex items-center gap-1">
                            <span>📅 Limite:</span>
                            <span>{new Date(task.due).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors border-none cursor-pointer"
                        title="Deletar permanentemente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GOOGLE DOCS */}
        {activeSubTab === 'docs' && accessToken && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-pink-600" />
                  Rascunhos no Google Docs
                </h2>
                <p className="text-xs text-slate-500 mt-1">Crie rascunhos de descrições premium de luxo, campanhas promocionais ou planejamentos mensais e envie direto para o Google Docs</p>
              </div>
              <button
                onClick={() => setIsCreatingDoc(!isCreatingDoc)}
                className="py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-pink-500/20 border-none cursor-pointer"
              >
                {isCreatingDoc ? <X size={14} /> : <Plus size={14} />}
                <span>{isCreatingDoc ? 'Fechar Formulário' : 'Novo Documento'}</span>
              </button>
            </div>

            {/* Docs insertion form */}
            {isCreatingDoc && (
              <form onSubmit={handleCreateDocument} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4 animate-fade-in">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Escrever Artigo / Documento</div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Título do Documento</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Campanha Dia dos Namorados AP Moda Fitness"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Textos / Conteúdo</label>
                      <button
                        type="button"
                        onClick={() => {
                          // Quick load from a simulated pricing or campaign planner
                          setNewDocTitle('Lookbook Outono-Inverno AP Moda Fitness');
                          setNewDocContent(`
# Lookbook Outono-Inverno AP Moda Fitness 🍁🧤

Olá, equipe da AP Moda Fitness! Este é o rascunho oficial de descrições e roteiros para Instagram referente ao lançamento das calças Cirrê e dos tops Emana.

## Looks Coordenados Recomendados:

### LOOK 1: Chic Cozy Aeróbico
* **Peças**: Legging Alta Performance Sculp Emana (Fio Emana Inteligente) pareada com Top Confort Rosa Magenta.
* **Vibe**: Look de treino de musculação de altíssimo impacto. Oferece conforto gelado, zero transparência garantido e detalhe empina-bumbum.

### LOOK 2: Glam Brilho Absoluto
* **Peças**: Conjunto Cirrê completo no Azul Petróleo com detalhe em tule.
* **Vibe**: Modernidade esportiva urbana para provador e reels.

-- Equipe de Redação Comercial AP Moda Fitness
                          `);
                        }}
                        className="text-[9px] text-pink-600 hover:text-pink-700 font-bold uppercase underline cursor-pointer bg-transparent border-0"
                      >
                        Carregar Exemplo de Texto
                      </button>
                    </div>
                    <textarea 
                      placeholder="Escreva em formato livre ou cole textos de agentes de IA aqui..."
                      value={newDocContent}
                      rows={6}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs p-3 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all font-mono resize-y"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                  >
                    <PlusSquare size={13} />
                    <span>{actionLoading ? 'Processando...' : 'Exportar para Google Docs'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List Google Docs from drive list */}
            {recentDocs.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                <FileText size={32} className="mx-auto text-slate-350" />
                <p className="text-slate-500 text-xs font-semibold">Nenhum rascunho em Google Doc detectado.</p>
                <p className="text-[10px] text-slate-400">Crie seu primeiro rascunho no painel acima para centralizar seus textos comerciais.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 text-left">DOCUMENTOS RECENTES NO SEU DRIVE</div>
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="p-3.5 border border-slate-100 bg-white rounded-xl flex items-center justify-between hover:bg-slate-50/20">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{doc.name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Criado: {formatTimeStr(doc.createdTime)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all text-decoration-none"
                      >
                        <span>Abrir Documento</span>
                        <ExternalLink size={10} />
                      </a>
                      
                      <button
                        onClick={() => handleDeleteFile(doc.id, doc.name)}
                        className="p-1 px-2 text-slate-400 hover:text-red-500 rounded-lg transition-all border-none cursor-pointer"
                        title="Deletar este documento permanentemente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GMAIL */}
        {activeSubTab === 'gmail' && accessToken && (
          <div className="p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100 text-left">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Mail size={18} className="text-pink-600" />
                Envios Inteligentes pelo Gmail
              </h2>
              <p className="text-xs text-slate-500 mt-1">Dispare comunicações de marketing, cupons para aniversariantes e recibos digitais no seu e-mail comercial da AP Moda Fitness</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form trigger sender */}
              <form onSubmit={handleSendEmail} className="lg:col-span-2 space-y-4 text-left">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Escrever E-mail Oficial</div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                  {/* Select client row mapping */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Autopreencher por CRM de Cliente</label>
                    <select
                      value={emailClientSelect}
                      onChange={handleClientEmailSelect}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all cursor-pointer font-sans"
                    >
                      <option value="">-- Selecionar Cliente Registrado em AP Moda Fitness --</option>
                      {clients.map((c, idx) => (
                        <option key={c.id} value={idx}>{c.name} ({c.email || 'Sem e-mail configurado'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">E-mail do Destinatário</label>
                      <input 
                        type="email" 
                        required
                        placeholder="cliente@exemplo.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Escolher Modelo / Template</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'invite', label: 'VIP Convite' },
                          { id: 'receipt', label: 'Cupom de Compra' },
                          { id: 'coupon', label: '15% Off Promo' }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => applyEmailTemplate(t.id)}
                            className={`py-1 px-1 rounded text-[10px] font-bold border cursor-pointer transition-all text-center
                              ${emailTemplate === t.id 
                                ? 'bg-pink-600 text-white border-pink-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Assunto do E-mail</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Seu Cupom Exclusivo de Boas-Vindas!"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Corpo do E-mail (HTML permitido)</label>
                    <textarea 
                      required
                      placeholder="Construa o conteúdo do e-mail em HTML ou texto livre..."
                      value={emailBody}
                      rows={6}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs p-3 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all font-mono resize-y"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2 px-5 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-pink-500/25 cursor-pointer border-none"
                  >
                    <Send size={13} />
                    <span>{actionLoading ? 'Processando Disparo...' : 'Disparar E-mail Pelo Gmail'}</span>
                  </button>
                </div>
              </form>

              {/* Sidebar guidance for email marketing */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-start items-start text-left space-y-4">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">DICAS DE OUTREACH GMAIL</div>
                
                <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <span>🌸 VIP Provador Vip</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Envie convites personalizados com o nome do cliente. Conexão profunda gera mais fidelidade!</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-200/50">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <span>📦 Recibo Automatizado</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Cobre recibos digitais rápidos pós-faturamento do PDV para garantir a percepção de e-commerce profissional de alta costura.</p>
                  </div>

                  <div className="p-3 bg-pink-50 border border-pink-100 rounded-xl text-[11px] text-pink-700 space-y-1">
                    <div className="font-bold">Aviso de Segurança:</div>
                    <p>O Gmail envia os e-mails diretamente da conta corporativa sincronizada via OAuth. Evite envios em massa excessivos para prevenir o bloqueio por spam.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GOOGLE SHEETS */}
        {activeSubTab === 'sheets' && accessToken && (
          <div className="p-6 space-y-6 text-left">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-pink-600" />
                Exportar para Planilhas Google
              </h2>
              <p className="text-xs text-slate-500 mt-1">Gere planilhas ricas e estruturadas na nuvem para analisar o caixa financeiro, inventários de tamanho e grades, ou o faturamento em BI</p>
            </div>

            <div className="max-w-2xl bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Qual Relatório Deseja Sincronizar na Nuvem?</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setSheetExportType('products'); setExportedSheetUrl(null); }}
                    className={`p-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                      ${sheetExportType === 'products'
                        ? 'bg-pink-600/10 border-pink-500 text-pink-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Folder size={20} />
                    <span>Catálogo de Estoque ({products.length} itens)</span>
                    <p className="text-[10.5px] text-slate-400 font-medium normal-case mt-0.5 text-center">Exporta ID, Peça, SKU, Grade, Preços, Custos e Vendas Acumuladas</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSheetExportType('sales'); setExportedSheetUrl(null); }}
                    className={`p-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                      ${sheetExportType === 'sales'
                        ? 'bg-pink-600/10 border-pink-500 text-pink-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <FileSpreadsheet size={20} />
                    <span>Registro de Vendas ({sales.length} transações)</span>
                    <p className="text-[10.5px] text-slate-400 font-medium normal-case mt-0.5 text-center">Exporta ID Venda, Cliente, Canal, Valor Recebido, Metas, Status e Data</p>
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-slate-800">Pronto para Enviar</div>
                  <p className="text-[11px] text-slate-400">Clique para criar uma planilha novinha e preencher os dados consolidados do seu banco de dados atual.</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleExportToSheets}
                  disabled={actionLoading}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/25 transition-all text-decoration-none border-none cursor-pointer"
                >
                  {actionLoading ? <RefreshCw className="animate-spin" size={13} /> : <FileSpreadsheet size={13} />}
                  <span>{actionLoading ? 'Exportando Planilha...' : 'Exportar Planilha Agora! ✨'}</span>
                </button>
              </div>

              {/* Box showing successful export link */}
              {exportedSheetUrl && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2.5 animate-fade-in">
                  <div className="text-xs font-bold text-emerald-800">Planilha Gerada com Sucesso em seu Google Sheets! 🎉</div>
                  <p className="text-[11px] text-slate-600">A sua planilha foi criada no nível raiz de arquivos do seu Drive e estruturada com colunas organizadas.</p>
                  <a
                    href={exportedSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-1.5 px-4 bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all hover:bg-emerald-700 hover:shadow-md text-decoration-none"
                  >
                    <span>Abrir Planilha Google de Vendas</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE DRIVE */}
        {activeSubTab === 'drive' && accessToken && (
          <div className="p-6 space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Folder size={18} className="text-pink-600" />
                  Arquivos do Google Drive e Documentação
                </h2>
                <p className="text-xs text-slate-500 mt-1">Navegue e gerencie as fotos de ensaios de catálogo, planilhas fiscais NFC-e e demais arquivos anexos armazenados em nuvem</p>
              </div>
              <button
                onClick={() => setIsUploading(!isUploading)}
                className="py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-pink-500/20 border-none cursor-pointer"
              >
                {isUploading ? <X size={14} /> : <Upload size={14} />}
                <span>{isUploading ? 'Fechar upload' : 'Subir Novo Arquivo'}</span>
              </button>
            </div>

            {/* Quick manual file upload to google drive */}
            {isUploading && (
              <form onSubmit={handleUploadFile} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4 animate-fade-in max-w-xl">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Upload de Arquivo de Texto</div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nome do Novo Arquivo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="registro_auditoria_estoque.txt"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Tipo do Arquivo (Mime-Type)</label>
                      <select
                        value={uploadFileType}
                        onChange={(e) => setUploadFileType(e.target.value)}
                        className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all cursor-pointer font-sans"
                      >
                        <option value="text/plain">Documento de Texto (.txt)</option>
                        <option value="text/csv">Arquivo Separado por Vírgulas (.csv)</option>
                        <option value="application/json">Arquivo estruturado JSON (.json)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Preencher Exemplo Rápido</label>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFileName(`relatorio_auditoria_${Date.now()}.txt`);
                          setUploadFileContent(`RELATÓRIO DE AUDITORIA DE CAPITAL DE GIRO E ESTOQUE\r\nData: ${new Date().toLocaleDateString()}\r\nTotal Produtos em Linha: ${products.length}\r\nValor Patrimonial Estimado do Estoque: R$ ${products.reduce((acc, p) => acc + (p.cost * p.stock), 0).toFixed(2)}\r\nAuditor: AP Moda Fitness AI Assistant\r\n\r\nOperação Realizada via API Sincronizada.`);
                        }}
                        className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[10.5px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Auditoria de Faturamento
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Conteúdo do Arquivo</label>
                    <textarea 
                      required
                      placeholder="Insira o texto interno que será salvo no arquivo do Drive..."
                      value={uploadFileContent}
                      rows={4}
                      onChange={(e) => setUploadFileContent(e.target.value)}
                      className="w-full bg-white text-slate-800 text-xs p-3 rounded-lg border border-slate-200 focus:border-pink-500 focus:ring-0 outline-none transition-all font-mono resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                  >
                    <Upload size={13} />
                    <span>Realizar Upload</span>
                  </button>
                </div>
              </form>
            )}

            {/* Files Grid and listings */}
            {driveFiles.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                <Folder size={32} className="mx-auto text-slate-350" />
                <p className="text-slate-500 text-xs font-semibold">Nenhum arquivo detectado no seu Google Drive corporativo.</p>
                <p className="text-[10px] text-slate-400 font-sans">Todos os arquivos carregados ou criados pela AP Moda Fitness aparecerão listados aqui.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500">TODOS OS ARQUIVOS LISTADOS ({driveFiles.length} itens)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driveFiles.map((file) => {
                    const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
                    const isDoc = file.mimeType === 'application/vnd.google-apps.document';
                    
                    return (
                      <div key={file.id} className="p-3.5 border border-slate-100 bg-white rounded-xl hover:bg-slate-50/50 hover:border-slate-200 flex flex-col justify-between transition-all group min-h-[140px] text-left">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {file.iconLink ? (
                              <img src={file.iconLink} alt="MimeIcon" className="w-4.5 h-4.5 shrink-0" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            ) : (
                              <Folder size={15} className="text-slate-400" />
                            )}
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono truncate">
                              {isSheet ? 'Planilha' : isDoc ? 'Google Doc' : 'Arquivo'}
                            </span>
                          </div>
                          
                          <div className="font-extrabold text-xs text-slate-800 line-clamp-2 pr-2 leading-snug">{file.name}</div>
                          <p className="text-[10px] text-slate-400">Criado: {formatTimeStr(file.createdTime)}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100/50 mt-3">
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg transition-all text-decoration-none border border-slate-200/55"
                          >
                            <span>Ir para Arquivo</span>
                            <ExternalLink size={9.5} />
                          </a>

                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-1 px-2 text-slate-400 hover:text-red-500 rounded-lg transition-all border-none cursor-pointer"
                            title="Eliminar arquivo da nuvem"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: DEVELOPER OAUTH MANUAL SETUP */}
        {activeSubTab === 'config' && (
          <div className="p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100 text-left">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Settings size={18} className="text-pink-600" />
                Configurar Credenciais OAuth Google Manualmente
              </h2>
              <p className="text-xs text-slate-500 mt-1">Preencha o Client ID e Client Secret obtidos no seu painel de desenvolvedor Google Cloud Console para ativar integrações</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form config loader */}
              <div className="lg:col-span-3 space-y-5 text-left">
                {configLoading ? (
                  <div className="py-12 text-center md:py-24 space-y-2">
                    <RefreshCw className="animate-spin text-pink-600 mx-auto" size={24} />
                    <p className="text-slate-550 text-xs font-semibold">Lendo configurações salvas em AP Moda Fitness...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveConfigs} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Google Client ID (ID do Cliente OAuth 2.0)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Google Client Secret (Chave Secreta do Cliente)</label>
                        {hasSecret && (
                          <span className="text-[9.5px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">✔ Já gravada no servidor</span>
                        )}
                      </div>
                      <input 
                        type="password" 
                        placeholder={hasSecret ? "•••••••••••••••••••••••••••••••• (Inalterada)" : "Insira a chave secreta fornecida no console..."}
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-pink-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Authorized Redirect URI (URI de Redirecionamento Autorizado)</label>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(redirectUri);
                            alert('URI de Redirecionamento copiado para o clipboard!');
                          }}
                          className="text-[9.5px] text-pink-600 hover:text-pink-700 font-bold uppercase underline cursor-pointer bg-transparent border-0"
                        >
                          Copiar Link
                        </button>
                      </div>
                      <input 
                        type="text" 
                        readOnly
                        value={redirectUri}
                        className="w-full bg-slate-100 text-slate-500 text-xs px-3 py-2.5 rounded-xl border border-slate-200/50 font-mono outline-none select-all"
                        title="Escreva este exato endereço nas configurações do seu Client ID no Google Cloud Console."
                      />
                      <p className="text-[10px] text-slate-400">Adicione este endereço nas configurações de credenciais do Google Cloud Console para liberar a autenticação sem erros.</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isConfigSaving}
                        className="py-2.5 px-6 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-pink-500/20 border-none transition-all cursor-pointer"
                      >
                        {isConfigSaving ? <RefreshCw className="animate-spin" size={13} /> : <PlusCircle size={13} />}
                        <span>{isConfigSaving ? 'Gravando Configurações...' : 'Salvar Configurações API Google'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sidebar tutorial instructions step-by-step */}
              <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-start items-start text-left space-y-4">
                <div className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">📋 COMO OBTER CREDENCIAIS GOOGLE</div>
                
                <div className="space-y-3.5 text-[11px] text-slate-650 leading-relaxed font-sans">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800">1. Vá para o Console Google Cloud:</div>
                    <p className="text-slate-500">Acesse <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">console.cloud.google.com</a>, selecione ou crie um projeto.</p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-850">2. Habilite as APIs necessárias:</div>
                    <p className="text-slate-500">Procure no campo busca e clique em habilitar nos seguintes serviços: <strong>Google Tasks API</strong>, <strong>Google Docs API</strong>, <strong>Google Calendar API</strong>, <strong>Gmail API</strong>, <strong>Google Sheets API</strong> e <strong>Google Drive API</strong>.</p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-850">3. Tela de Consentimento (OAuth):</div>
                    <p className="text-slate-500">Vá em Menu &gt; APIs e Serviços &gt; Tela de consentimento OAuth. Selecione "Externo", dê um nome ao app e salve.</p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-850">4. Criar credenciais OAuth:</div>
                    <p className="text-slate-500">Vá em Menu &gt; APIs e Serviços &gt; Credenciais. Clique em "Criar Credenciais" &gt; "ID do cliente OAuth". Selecione "Aplicativo da Web". No campo redirecionamentos cole a URI copiada ao lado.</p>
                  </div>

                  <div className="p-3 bg-pink-100/50 border border-pink-100 text-pink-700 rounded-xl space-y-1 mt-2">
                    <div className="font-bold">Nota de Configuração:</div>
                    <p>Ao salvar os dados, paste o Client ID e Client Secret nos inputs desta página e salve para liberar o botão de conectar acima.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
