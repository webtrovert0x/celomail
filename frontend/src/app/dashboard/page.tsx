'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useMailbox } from '@/hooks/useMailbox'
import { uploadToIPFS, fetchFromIPFS, uploadFileToIPFS } from '@/utils/ipfs'
import { encryptMessage, decryptMessage } from '@/utils/crypto'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, PenSquare, Send, RefreshCw, Key, ShieldCheck, Mail, CheckCircle2, XCircle, Loader2, Settings, Users, UserPlus, Trash2, Search, FileText, Archive as ArchiveIcon, ArrowLeft, Menu, Paperclip, BadgeCheck } from 'lucide-react'
import { useBalance } from 'wagmi'
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

export default function Dashboard() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { data: balanceData } = useBalance({ address: address as `0x${string}` | undefined })
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'contacts' | 'archive'>('inbox')
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Archive
  const [archivedCids, setArchivedCids] = useState<string[]>([])

  const loadArchive = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/archive?owner=${address}`);
      const data = await res.json();
      if (data.cids) setArchivedCids(data.cids);
    } catch (e) {
      console.error(e);
    }
  }

  const handleArchive = async (cid: string) => {
    if (!address) return;
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: address, cid })
      });
      const data = await res.json();
      if (res.ok) {
        setArchivedCids(data.cids);
        toast.success("Message archived");
        setSelectedMessage(null);
      }
    } catch (e) {
      toast.error("Failed to archive message");
    }
  }

  const handleUnarchive = async (cid: string) => {
    if (!address) return;
    try {
      const res = await fetch(`/api/archive?owner=${address}&cid=${cid}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setArchivedCids(data.cids);
        toast.success("Message unarchived");
        setSelectedMessage(null);
      }
    } catch (e) {
      toast.error("Failed to unarchive message");
    }
  }

  const { sendMessage, signMessageText, getMyMessages, getSentMessages, getMyAlias, registerAlias, checkAliasAvailability, resolveAlias, getAliasForAddress } = useMailbox()
  const [myAlias, setMyAlias] = useState<string | null>(null)
  
  // Inbox State
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [inboxPage, setInboxPage] = useState(1)

  // Sent State
  const [sentMessages, setSentMessages] = useState<any[]>([])
  const [loadingSent, setLoadingSent] = useState(true)
  const [sentPage, setSentPage] = useState(1)

  const ITEMS_PER_PAGE = 5;

  // Contacts State
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [newContactAlias, setNewContactAlias] = useState('')
  const [isAddingContact, setIsAddingContact] = useState(false)

  // Compose State
  const [toAlias, setToAlias] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Register State
  const [registerInput, setRegisterInput] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [emailPref, setEmailPref] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const loadSettings = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/preferences?owner=${address}`);
      const data = await res.json();
      if (data.email) setEmailPref(data.email);
    } catch (e) {
      console.error(e);
    }
  }

  const saveSettings = async () => {
    if (!address) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: address, email: emailPref })
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully");
      setIsSettingsOpen(false);
    } catch (e) {
      toast.error("Error saving settings");
    }
    setIsSavingSettings(false);
  }

  useEffect(() => {
    const checkAvailability = async () => {
      const cleanAlias = registerInput.replace('@cmail.com', '').toLowerCase().trim()
      if (!cleanAlias) {
        setIsAvailable(null)
        return
      }
      setIsChecking(true)
      const available = await checkAliasAvailability(cleanAlias)
      setIsAvailable(available)
      setIsChecking(false)
    }

    const timeout = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timeout)
  }, [registerInput])

  useEffect(() => {
    setMounted(true)
    if (mounted && !isConnected) {
      router.push('/')
    }
  }, [isConnected, mounted, router])

  useEffect(() => {
    if (isConnected && address) {
      loadInbox()
      loadSentMessages()
      loadContacts()
      loadArchive()
      loadSettings()
      loadDraft()
      getMyAlias().then(alias => setMyAlias(alias))
    }
  }, [isConnected, address])

  const loadDraft = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/drafts?owner=${address}`);
      const data = await res.json();
      if (data.draft) {
        setToAlias(data.draft.toAlias || '');
        if (data.draft.content) {
           setMessageContent(data.draft.content);
        }
      }
    } catch (e) {
      console.error("Failed to load draft");
    }
  }

  // Auto-save draft effect
  useEffect(() => {
    if (!address || (activeTab !== 'compose')) return;
    
    const saveDraft = async () => {
      // Don't save empty drafts needlessly
      if (!toAlias && !messageContent) return;
      
      try {
        await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerAddress: address, toAlias, content: messageContent })
        });
      } catch (e) {
        // silent fail for auto-save
      }
    };

    const interval = setInterval(saveDraft, 5000); // Save every 5 seconds
    return () => clearInterval(interval);
  }, [address, toAlias, messageContent, activeTab]);

  // Polling for new messages
  useEffect(() => {
    if (!address) return;
    
    const pollMessages = async () => {
      try {
        const rawMessages = await getMyMessages();
        // If the blockchain has more messages than we currently have rendered
        if (rawMessages.length > messages.length && messages.length > 0) {
          const newMsgCount = rawMessages.length - messages.length;
          toast(`You have ${newMsgCount} new encrypted message(s)!`, {
            icon: '📬',
            style: { borderRadius: '10px', background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a' },
            duration: 5000,
          });
          
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
          } catch (e) {}

          loadInbox(); // Silently refresh the UI to show the new message
        }
      } catch (e) {
        // silent fail for polling
      }
    };

    const interval = setInterval(pollMessages, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [address, messages.length]);

  const loadInbox = async (page = inboxPage) => {
    if (!address) return;
    setLoadingMessages(true)
    try {
      const rawMessages = await getMyMessages()
      rawMessages.sort((a, b) => b.timestamp - a.timestamp) // Newest first
      
      const paginatedRaw = rawMessages.slice(0, page * ITEMS_PER_PAGE)
      
      const decryptedMsgs = await Promise.all(paginatedRaw.map(async (msg) => {
        let senderAlias = null
        try {
          senderAlias = await getAliasForAddress(msg.sender as string)
        } catch (e) {}

        try {
          const encryptedBase64 = await fetchFromIPFS(msg.contentCID as string)
          const decrypted = await decryptMessage(encryptedBase64, msg.sender as string, address as string)
          return { ...msg, decryptedPayload: decrypted, senderAlias }
        } catch (e) {
          return { ...msg, decryptedPayload: { text: "Failed to load or decrypt IPFS content", isVerified: false }, senderAlias }
        }
      }))
      setMessages(decryptedMsgs)
    } catch (e) {
      console.error(e)
    }
    setLoadingMessages(false)
  }

  const loadSentMessages = async (page = sentPage) => {
    if (!address) return;
    setLoadingSent(true)
    try {
      const rawMessages = await getSentMessages()
      rawMessages.sort((a, b) => b.timestamp - a.timestamp)
      
      const paginatedRaw = rawMessages.slice(0, page * ITEMS_PER_PAGE)
      
      const decryptedMsgs = await Promise.all(paginatedRaw.map(async (msg) => {
        let recipientAlias = null
        try {
          recipientAlias = await getAliasForAddress(msg.recipient as string)
        } catch (e) {}

        try {
          const encryptedBase64 = await fetchFromIPFS(msg.contentCID as string)
          const decrypted = await decryptMessage(encryptedBase64, address as string, msg.recipient as string)
          return { ...msg, decryptedPayload: decrypted, recipientAlias }
        } catch (e) {
          return { ...msg, decryptedPayload: { text: "Failed to load or decrypt IPFS content", isVerified: false }, recipientAlias }
        }
      }))
      setSentMessages(decryptedMsgs)
    } catch (e) {
      console.error(e)
    }
    setLoadingSent(false)
  }

  const loadContacts = async () => {
    if (!address) return;
    setLoadingContacts(true)
    try {
      const res = await fetch(`/api/contacts?owner=${address}`)
      const data = await res.json()
      if (data.contacts) {
        setContacts(data.contacts)
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingContacts(false)
  }

  const handleAddContact = async () => {
    if (!newContactAlias || !address) return;
    setIsAddingContact(true)
    try {
      const cleanAlias = newContactAlias.replace('@cmail.com', '').toLowerCase().trim()
      const contactAddress = await resolveAlias(cleanAlias)
      
      if (!contactAddress) {
        throw new Error(`The alias '${cleanAlias}' does not exist!`)
      }

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: address,
          alias: cleanAlias,
          contactAddress: contactAddress
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Added ${cleanAlias}@cmail.com to your address book!`)
      setNewContactAlias('')
      loadContacts()
    } catch (e: any) {
      toast.error(e.message || "Failed to add contact")
    }
    setIsAddingContact(false)
  }

  const handleDeleteContact = async (alias: string) => {
    if (!address) return;
    try {
      const res = await fetch(`/api/contacts?owner=${address}&alias=${alias}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`Removed ${alias} from address book`)
        loadContacts()
      }
    } catch (e: any) {
      toast.error("Failed to delete contact")
    }
  }

  const handleSend = async () => {
    if (!toAlias || !messageContent || !address) return;
    setIsSending(true)
    try {
      const cleanToAlias = toAlias.replace('@cmail.com', '').toLowerCase().trim()
      
      const recipientAddress = await resolveAlias(cleanToAlias)
      if (!recipientAddress) {
        throw new Error(`The alias '${cleanToAlias}' does not exist!`)
      }

      // 1. Sign Message
      let signature;
      try {
        signature = await signMessageText(messageContent);
      } catch (e) {
        throw new Error("You must sign the message to prove authenticity.");
      }

      // 2. Upload Attachment if exists
      let attachmentCID;
      if (attachmentFile) {
        if (attachmentFile.size > 5 * 1024 * 1024) {
          throw new Error("Attachment exceeds 5MB limit");
        }
        const loadingId = toast.loading("Uploading attachment to IPFS...");
        attachmentCID = await uploadFileToIPFS(attachmentFile);
        toast.dismiss(loadingId);
      }

      // 3. Structure V2 JSON Payload
      const payload = {
        text: messageContent,
        signature,
        attachmentCID
      }

      const encrypted = await encryptMessage(JSON.stringify(payload), address, recipientAddress)
      const cid = await uploadToIPFS(encrypted)
      await sendMessage(cleanToAlias, cid)
      
      // Trigger Email Notification asynchronously
      fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress,
          senderAlias: myAlias || "Anonymous"
        })
      }).catch(err => console.warn("Email notification failed", err));
      
      toast.success("Message sent successfully and stored on IPFS!")
      
      // Delete draft after sending
      fetch(`/api/drafts?owner=${address}`, { method: 'DELETE' }).catch(() => {});
      
      setToAlias('')
      setMessageContent('')
      setAttachmentFile(null)
      setActiveTab('sent')
      loadSentMessages()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to send: Transaction reverted")
    }
    setIsSending(false)
  }

  const handleRegister = async () => {
    if (!registerInput) return;
    setIsRegistering(true)
    try {
      const cleanAlias = registerInput.replace('@cmail.com', '').toLowerCase()
      await registerAlias(cleanAlias)
      setMyAlias(cleanAlias)
      toast.success(`Successfully registered ${cleanAlias}@cmail.com!`)
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to register alias: " + e.message)
    }
    setIsRegistering(false)
  }

  if (!mounted || !isConnected) return null

  return (
    <>
      <div className="min-h-screen bg-white flex overflow-hidden font-sans text-slate-800">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[#111111] text-slate-300 flex flex-col justify-between shrink-0 h-screen border-r border-gray-800 absolute md:relative z-50 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <Image src="/IMG_6074.PNG" alt="CeloMail Logo" width={32} height={32} className="rounded-md object-contain" unoptimized />
            <div className="font-bold text-lg text-white tracking-widest uppercase">CELOMAIL</div>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            <button 
              onClick={() => { setActiveTab('inbox'); loadInbox(); setSelectedMessage(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'inbox' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Inbox size={18} className={activeTab === 'inbox' ? 'text-yellow-500' : 'text-gray-400'} />
                Inbox
              </div>
              {messages.filter(msg => !archivedCids.includes(msg.contentCID)).length > 0 && (
                <span className="bg-yellow-500/20 text-yellow-600 text-xs py-0.5 px-2 rounded-full font-bold">
                  {messages.filter(msg => !archivedCids.includes(msg.contentCID)).length}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => { setActiveTab('sent'); loadSentMessages(); setSelectedMessage(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'sent' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <Send size={18} className={activeTab === 'sent' ? 'text-yellow-500' : 'text-gray-400'} />
              Sent
            </button>
            
            <button 
              onClick={() => { setActiveTab('compose'); setSelectedMessage(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'compose' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <FileText size={18} className={activeTab === 'compose' ? 'text-yellow-500' : 'text-gray-400'} />
              Drafts
            </button>
            
            <button 
              onClick={() => { setActiveTab('archive'); setSelectedMessage(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'archive' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white text-gray-400'}`}
            >
              <ArchiveIcon size={18} className={activeTab === 'archive' ? 'text-yellow-500' : ''} />
              Archive
            </button>
            
            <button 
              onClick={() => { setActiveTab('contacts'); loadContacts(); setSelectedMessage(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === 'contacts' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white text-gray-400'}`}
            >
              <Users size={18} className={activeTab === 'contacts' ? 'text-yellow-500' : ''} />
              Contacts
            </button>
            
            <button onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-all font-medium">
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-6 border-t border-gray-800/60">
          <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">WALLET</div>
          <div className="text-white text-sm font-mono truncate mb-1">
            {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Not Connected'}
          </div>
          <div className="text-gray-400 text-sm">
            {balanceData ? `${parseFloat(balanceData.formatted).toFixed(2)} ${balanceData.symbol}` : '14.2 CELO'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        
        {/* Top Bar */}
        <header className="h-[72px] border-b border-gray-100 flex items-center px-4 md:px-8 bg-white shrink-0 gap-4">
          <button 
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="relative w-full max-w-xl flex items-center">
            <Search size={16} className="absolute left-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-gray-50 border border-gray-100 rounded-md py-2.5 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-medium"
            />
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {/* Inbox / Sent / Archive Lists */}
          {(activeTab === 'inbox' || activeTab === 'sent' || activeTab === 'archive') && (
            selectedMessage ? (
              <div className="flex flex-col h-full bg-white relative">
                <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10 shrink-0">
                  <button 
                    onClick={() => setSelectedMessage(null)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="font-bold text-gray-800 text-lg">Message Details</div>
                </div>
                
                <div className="p-8 max-w-4xl">
                  {/* Sender info */}
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
                      {(selectedMessage.senderAlias || selectedMessage.recipientAlias || (activeTab === 'inbox' ? selectedMessage.sender : selectedMessage.recipient)).charAt(activeTab === 'inbox' && !selectedMessage.senderAlias ? 2 : 0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {activeTab === 'inbox' 
                            ? (selectedMessage.senderAlias ? `${selectedMessage.senderAlias} (${selectedMessage.senderAlias}.celo)` : selectedMessage.sender)
                            : (selectedMessage.recipientAlias ? `${selectedMessage.recipientAlias} (${selectedMessage.recipientAlias}.celo)` : selectedMessage.recipient)}
                          
                          {selectedMessage.decryptedPayload?.isVerified && (
                            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                              <BadgeCheck size={14} /> Verified Signature
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(selectedMessage.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        to {activeTab === 'inbox' ? 'me' : (selectedMessage.recipientAlias || selectedMessage.recipient)}
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div 
                    className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap bg-gray-50 p-8 rounded-2xl border border-gray-100 min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.decryptedPayload?.text || selectedMessage.decryptedContent || "Encrypted Message" }}
                  />
                  
                  {/* Attachments */}
                  {selectedMessage.decryptedPayload?.attachmentCID && (
                    <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
                          <Paperclip size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">Secure Attachment</div>
                          <div className="text-xs text-gray-500">IPFS CID: {selectedMessage.decryptedPayload.attachmentCID.slice(0, 10)}...</div>
                        </div>
                      </div>
                      <a 
                        href={`https://gateway.pinata.cloud/ipfs/${selectedMessage.decryptedPayload.attachmentCID}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-sm font-bold text-gray-700 transition-colors"
                      >
                        View / Download
                      </a>
                    </div>
                  )}
                  
                  {/* Footer / actions */}
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => {
                        setToAlias(activeTab === 'inbox' || activeTab === 'archive' ? (selectedMessage.senderAlias || selectedMessage.sender) : (selectedMessage.recipientAlias || selectedMessage.recipient));
                        setActiveTab('compose');
                        setSelectedMessage(null);
                      }}
                      className="px-6 py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft size={16} /> Reply
                    </button>
                    {(activeTab === 'inbox' || activeTab === 'archive') && (
                      archivedCids.includes(selectedMessage.contentCID) ? (
                        <button 
                          onClick={() => handleUnarchive(selectedMessage.contentCID)}
                          className="px-6 py-2.5 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-600 font-bold rounded-lg transition-colors flex items-center gap-2 ml-auto"
                        >
                          <ArchiveIcon size={16} /> Unarchive
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleArchive(selectedMessage.contentCID)}
                          className="px-6 py-2.5 bg-gray-50 border border-gray-200 hover:bg-red-50 text-red-500 font-bold rounded-lg transition-colors flex items-center gap-2 ml-auto"
                        >
                          <ArchiveIcon size={16} /> Archive
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 md:gap-6 items-center px-4 md:px-8 py-3 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="w-8 md:w-10"></div> {/* Avatar spacer */}
                <div className="grid grid-cols-[1fr] md:grid-cols-[1fr_2fr] gap-4">
                  <div>SENDER</div>
                  <div className="hidden md:block">SUBJECT</div>
                </div>
                <div className="w-16 md:w-24 text-right">TIME</div>
              </div>

              {/* List */}
              <div className="flex flex-col">
                {((activeTab === 'inbox' || activeTab === 'archive' ? loadingMessages : loadingSent)) ? (
                  <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={24} className="animate-spin text-yellow-500" />
                    Loading messages...
                  </div>
                ) : (() => {
                  const baseMessages = (activeTab === 'inbox' || activeTab === 'archive') ? messages : sentMessages;
                  const filteredMessages = baseMessages.filter(msg => {
                    if (activeTab === 'inbox' && archivedCids.includes(msg.contentCID)) return false;
                    if (activeTab === 'archive' && !archivedCids.includes(msg.contentCID)) return false;
                    if (searchQuery) {
                      const lowerQuery = searchQuery.toLowerCase();
                      const matchContent = msg.decryptedContent?.toLowerCase().includes(lowerQuery);
                      const matchSenderAlias = msg.senderAlias?.toLowerCase().includes(lowerQuery);
                      const matchRecipientAlias = msg.recipientAlias?.toLowerCase().includes(lowerQuery);
                      if (!matchContent && !matchSenderAlias && !matchRecipientAlias) return false;
                    }
                    return true;
                  });

                  if (filteredMessages.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center p-16 mt-8">
                        <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                          <Inbox size={40} className="text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {activeTab === 'inbox' ? 'Your Inbox is Empty' : 
                           activeTab === 'sent' ? 'No Sent Messages' : 
                           'Nothing in Archive'}
                        </h3>
                        <p className="text-gray-500 text-center max-w-sm mb-8">
                          {activeTab === 'inbox' 
                            ? "Welcome to Web3! When someone sends you an encrypted message, it will appear right here." 
                            : "You haven't sent any encrypted messages yet. Why not say hello to someone?"}
                        </p>
                        <button 
                          onClick={() => setActiveTab('compose')}
                          className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <PenSquare size={18} /> Compose a Message
                        </button>
                      </div>
                    );
                  }

                  return filteredMessages.map((msg, i) => {
                    // Logic to format row
                    const isInbox = activeTab === 'inbox' || activeTab === 'archive';
                    const userAddr = isInbox ? msg.sender : msg.recipient;
                    const userAlias = isInbox ? msg.senderAlias : (msg.recipientAlias || null);
                    
                    const senderName = userAlias ? `${userAlias.charAt(0).toUpperCase() + userAlias.slice(1)} (${userAlias}@cmail.com)` : `${userAddr.slice(0,6)}...${userAddr.slice(-4)}`;
                    const initial = userAlias ? userAlias.charAt(0).toUpperCase() : userAddr.charAt(2).toUpperCase();
                    const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    return (
                      <div key={i} onClick={() => setSelectedMessage(msg)} className="grid grid-cols-[auto_1fr_auto] gap-2 md:gap-6 items-center px-4 md:px-8 py-3.5 border-b border-gray-50 cursor-pointer transition-colors relative hover:bg-gray-50 group">
                        {/* Hover selected state indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm shadow-sm">
                          {initial}
                        </div>
                        
                        <div className="grid grid-cols-[1fr] md:grid-cols-[1fr_2fr] gap-1 md:gap-4 items-center">
                          <div className="font-bold text-gray-800 text-sm truncate">{senderName}</div>
                          <div className="text-gray-500 text-sm font-medium truncate hidden md:block">{msg.decryptedPayload?.text || msg.decryptedContent || "Encrypted Message"}</div>
                          {/* Mobile preview snippet */}
                          <div className="text-gray-400 text-xs truncate md:hidden">{msg.decryptedPayload?.text || msg.decryptedContent || "Encrypted Message"}</div>
                        </div>
                        
                        <div className="w-16 md:w-24 text-right text-[10px] md:text-xs font-semibold text-gray-400 whitespace-nowrap">
                          {time}
                        </div>
                      </div>
                    )
                  });
                })()}
                
                {/* Load More Button */}
                {((activeTab === 'inbox' && messages.length >= inboxPage * ITEMS_PER_PAGE) || 
                  (activeTab === 'sent' && sentMessages.length >= sentPage * ITEMS_PER_PAGE)) && (
                  <div className="flex justify-center mt-6 mb-8">
                    <button 
                      onClick={() => {
                        if (activeTab === 'inbox') {
                          setInboxPage(p => p + 1);
                          loadInbox(inboxPage + 1);
                        } else if (activeTab === 'sent') {
                          setSentPage(p => p + 1);
                          loadSentMessages(sentPage + 1);
                        }
                      }}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                    >
                      Load More Messages
                    </button>
                  </div>
                )}
              </div>
            </>
            )
          )}

          {/* Contacts (Address Book) */}
          {activeTab === 'contacts' && (
            <div className="max-w-4xl mx-auto mt-10 p-8">
               <div className="flex justify-between items-end mb-8">
                 <div>
                   <h2 className="text-2xl font-bold mb-1 text-gray-800">Address Book</h2>
                   <p className="text-gray-500 text-sm">Your encrypted Web3 contacts</p>
                 </div>
                 
                 <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                   <input 
                     type="text" 
                     value={newContactAlias}
                     onChange={(e) => setNewContactAlias(e.target.value)}
                     placeholder="Add alias..."
                     className="bg-transparent border-none outline-none px-4 py-2 text-gray-800 placeholder-gray-400 w-48 font-medium"
                   />
                   <button 
                     onClick={handleAddContact}
                     disabled={isAddingContact || !newContactAlias}
                     className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white p-2 rounded-lg transition-colors shadow-sm"
                   >
                     {isAddingContact ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                   </button>
                 </div>
               </div>

               {loadingContacts ? (
                 <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                   <Loader2 size={24} className="animate-spin text-yellow-500" />
                   Loading contacts...
                 </div>
               ) : contacts.length === 0 ? (
                 <div className="p-12 text-center text-gray-400 mt-10 flex flex-col items-center gap-4">
                   <Users size={40} className="text-gray-300" />
                   <p>No contacts saved yet.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                   {contacts.map((contact, i) => (
                     <div 
                       key={contact._id || i}
                       className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between group hover:border-gray-300 transition-colors shadow-sm hover:shadow-md"
                     >
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0">
                           <span className="text-yellow-500 font-bold text-lg uppercase">{contact.alias.charAt(0)}</span>
                         </div>
                         <div className="min-w-0">
                           <div className="font-bold text-gray-800 mb-0.5 truncate">{contact.alias}@cmail.com</div>
                           <div className="text-xs text-gray-500 font-mono truncate">{contact.contactAddress.slice(0,8)}...{contact.contactAddress.slice(-6)}</div>
                         </div>
                       </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                         <button 
                           onClick={() => { setToAlias(contact.alias); setActiveTab('compose'); setSelectedMessage(null); }}
                           className="p-2 bg-yellow-50 text-yellow-500 hover:bg-yellow-100 rounded-lg transition-colors"
                           title="Send Message"
                         >
                           <Mail size={16} />
                         </button>
                         <button 
                           onClick={() => handleDeleteContact(contact.alias)}
                           className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                           title="Delete Contact"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* Compose / Drafts Form */}
          {activeTab === 'compose' && (
             <div className="max-w-3xl mx-auto mt-10 p-8 border border-gray-100 rounded-xl bg-white shadow-sm">
               <h2 className="text-2xl font-bold mb-6 text-gray-800">New Draft</h2>
               <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">To (Alias)</label>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={toAlias}
                        onChange={e => setToAlias(e.target.value)}
                        placeholder="recipient"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-24 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-medium"
                      />
                      <span className="absolute right-4 text-gray-400 font-semibold pointer-events-none">@cmail.com</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Message Payload</label>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-yellow-500 focus-within:border-yellow-500 transition-all">
                      <ReactQuill 
                        theme="snow" 
                        value={messageContent} 
                        onChange={setMessageContent}
                        placeholder="Write your encrypted message here..."
                        className="min-h-[250px] font-medium leading-relaxed bg-gray-50 text-gray-800"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, false] }],
                            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                            ['link', 'clean']
                          ],
                        }}
                      />
                    </div>
                  </div>

                    <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors flex items-center gap-2 font-medium text-sm">
                        <Paperclip size={16} />
                        {attachmentFile ? (
                          <span className="text-yellow-600 truncate max-w-[150px]">{attachmentFile.name}</span>
                        ) : (
                          <span>Attach File (Max 5MB)</span>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAttachmentFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {attachmentFile && (
                        <button 
                          onClick={() => setAttachmentFile(null)}
                          className="text-red-400 hover:text-red-500"
                          title="Remove attachment"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={isSending || !toAlias || !messageContent || messageContent === '<p><br></p>'}
                      className="px-8 py-3 bg-yellow-500 text-white font-bold text-sm rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                      {isSending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      {isSending ? 'Encrypting...' : 'Encrypt & Send'}
                    </button>
                  </div>
                </div>
             </div>
          )}

          {/* Registration Fallback (If no alias) */}
          {(!myAlias && activeTab !== 'compose' && !loadingMessages && !loadingSent) && (
             <div className="max-w-md mx-auto mt-20 p-8 border border-gray-100 rounded-xl bg-gray-50 shadow-sm text-center">
               <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500">
                 <Key size={32} />
               </div>
               <h2 className="text-xl font-bold mb-2 text-gray-800">Claim Your Identity</h2>
               <p className="text-gray-500 text-sm mb-6">Register a unique alias to start using CELOMAIL.</p>
               
               <div className="w-full relative flex items-center mb-2">
                  <input 
                    type="text" 
                    value={registerInput}
                    onChange={e => setRegisterInput(e.target.value)}
                    placeholder="satoshi"
                    className="w-full bg-white border border-gray-200 rounded-lg pl-4 pr-32 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-medium"
                  />
                  <span className="absolute right-4 text-gray-400 font-semibold pointer-events-none">@cmail.com</span>
                </div>
                
                <div className="h-6 mb-4 text-xs text-left w-full flex items-center gap-1">
                  {registerInput && isChecking && <><Loader2 size={14} className="text-gray-400 animate-spin" /><span className="text-gray-500">Checking...</span></>}
                  {registerInput && !isChecking && isAvailable === true && <><CheckCircle2 size={14} className="text-yellow-500" /><span className="text-yellow-500">Available!</span></>}
                  {registerInput && !isChecking && isAvailable === false && <><XCircle size={14} className="text-red-500" /><span className="text-red-500">Taken</span></>}
                </div>

                <button 
                  onClick={handleRegister}
                  disabled={isRegistering || !registerInput || isAvailable === false || isChecking}
                  className="w-full px-6 py-3 bg-yellow-500 text-white font-bold text-sm rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all"
                >
                  {isRegistering ? 'Registering...' : 'Register Alias'}
                </button>
             </div>
          )}
        </section>
      </main>
    </div>
    
    {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-yellow-500" size={24} /> Settings
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Web2 Email Notifications</label>
                <p className="text-xs text-gray-500 mb-3">Link your standard email address to receive a notification when you get a new encrypted message. We never send the contents of your message.</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    value={emailPref}
                    onChange={(e) => setEmailPref(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all bg-gray-50"
                  />
                </div>
              </div>
              
              <button 
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isSavingSettings ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {isSavingSettings ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}