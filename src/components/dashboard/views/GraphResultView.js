import { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Flex, Text, Button, Input, Textarea, Spinner, SimpleGrid } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, RepeatIcon, CopyIcon, CheckIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { ENUM_CATALOG, slugify } from './graphEnumCatalog';

const MotionBox = motion(Box);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const authHdr = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const BLUE   = '#63B3ED';
const GREEN  = '#68D391';
const RED    = '#FC8181';
const ORANGE = '#F6AD55';
const PURPLE = '#9F7AEA';
const CYAN   = '#76E4F7';
const YELLOW = '#ECC94B';

// ── Caching ──────────────────────────────────────────────────────────────────
const cacheKey = (cat, q) => `dc_cache_${cat}_${q}`;
function saveCache(cat, q, data) {
  try { localStorage.setItem(cacheKey(cat, q), JSON.stringify({ data, ts: Date.now() })); } catch {}
}
function loadCache(cat, q) {
  try { return JSON.parse(localStorage.getItem(cacheKey(cat, q)) || 'null'); } catch { return null; }
}

// ── Type detection ────────────────────────────────────────────────────────────
function detectType(items, endpoint = '') {
  if (!items || items.length === 0) return 'empty';
  const f = items[0];
  if ('userPrincipalName' in f) return 'users';
  if ('subject' in f && 'receivedDateTime' in f) return 'emails';
  if ('name' in f && ('file' in f || 'folder' in f || 'size' in f)) return 'files';
  if ('operatingSystem' in f && 'deviceId' in f) return 'devices';
  if ('appId' in f && 'servicePrincipalType' in f) return 'servicePrincipals';
  if ('appId' in f && 'signInAudience' in f) return 'applications';
  if ('userDisplayName' in f && 'appDisplayName' in f && 'createdDateTime' in f) return 'signInLogs';
  if ('authenticationMethodType' in f || ('@odata.type' in f && String(f['@odata.type']).includes('authenticationMethod'))) return 'authMethods';
  if ('conditions' in f && 'grantControls' in f) return 'conditionalAccess';
  if ('roleDefinitionId' in f && 'principalId' in f) return 'roleAssignments';
  if ('groupTypes' in f || ('mailEnabled' in f && 'securityEnabled' in f)) return 'groups';
  if ('roleTemplateId' in f || ('isBuiltIn' in f && 'templateId' in f)) return 'roles';
  if ('chatType' in f || (endpoint.includes('chats') && 'members' in f)) return 'chats';
  if ('internalId' in f || (endpoint.includes('joinedTeams') && 'displayName' in f)) return 'teams';
  if ('scope' in f && 'clientId' in f) return 'oauth2Grants';
  if ('displayName' in f && 'siteCollection' in f) return 'sites';
  return 'generic';
}

function fmt(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

// ── Graph proxy helper ────────────────────────────────────────────────────────
async function graphCall(accessToken, endpoint, method = 'GET', body) {
  const r = await fetch(`${API}/device-code/graph`, {
    method: 'POST', headers: authHdr(),
    body: JSON.stringify({ accessToken, endpoint, method, body }),
  });
  return r.json();
}

// ── Small reusable components ─────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <Box display="inline-flex" px={2} py="1px" borderRadius="5px"
      bg={`${color}20`} border={`1px solid ${color}40`}>
      <Text fontSize="10px" color={color} fontWeight="semibold">{label}</Text>
    </Box>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button size="xs" variant="ghost" p={1} minW="unset" h="auto"
      color={copied ? GREEN : 'var(--dash-text-muted)'}
      _hover={{ color: copied ? GREEN : 'white' }}
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      {copied ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
    </Button>
  );
}

function DarkTable({ headers, rows, accentColor }) {
  return (
    <Box overflowX="auto" borderRadius="12px" border="1px solid rgba(255,255,255,0.07)">
      <Box as="table" w="full" style={{ borderCollapse: 'collapse' }}>
        <Box as="thead">
          <Box as="tr" bg="rgba(0,0,0,0.4)">
            {headers.map((h) => (
              <Box as="th" key={h} px={4} py={2} textAlign="left"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Text fontSize="10px" fontWeight="bold" letterSpacing="wider"
                  textTransform="uppercase" color={accentColor}>{h}</Text>
              </Box>
            ))}
          </Box>
        </Box>
        <Box as="tbody">
          {rows.map((row, i) => (
            <Box as="tr" key={i}
              bg={i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
              _hover={{ bg: 'rgba(255,255,255,0.04)' }}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {row.map((cell, j) => (
                <Box as="td" key={j} px={4} py={2.5} verticalAlign="middle">
                  {typeof cell === 'string' || typeof cell === 'number'
                    ? <Text fontSize="12px" color="var(--dash-text-primary)">{cell || '—'}</Text>
                    : cell}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ── Email Client ──────────────────────────────────────────────────────────────
function ComposeModal({ accessToken, color, onClose, replyTo }) {
  const [to, setTo]       = useState(replyTo?.from?.emailAddress?.address || '');
  const [cc, setCc]       = useState('');
  const [subject, setSub] = useState(replyTo ? `RE: ${replyTo.subject}` : '');
  const [body, setBody]   = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]   = useState(false);

  const [sendError, setSendError] = useState('');

  const send = async () => {
    setSending(true);
    setSendError('');
    try {
      const r = await fetch(`${API}/device-code/send-mail`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({
          accessToken,
          to,
          cc,
          subject,
          body,
          ...(replyTo ? { replyToId: replyTo.id } : {}),
        }),
      });
      const d = await r.json();
      if (d.success) {
        setSent(true);
        setTimeout(onClose, 1200);
      } else {
        setSendError(d.error?.message || d.message || JSON.stringify(d));
      }
    } catch (e) { setSendError(e.message); }
    setSending(false);
  };

  return (
    <Box position="fixed" inset={0} bg="rgba(0,0,0,0.7)" zIndex={1000} display="flex" alignItems="center" justifyContent="center"
      onClick={onClose}>
      <Box bg="#13131A" border={`1px solid ${color}40`} borderRadius="16px" w="600px" maxH="80vh"
        overflow="hidden" onClick={(e) => e.stopPropagation()}>
        <Box h="3px" bgGradient={`linear(to-r, ${color}, ${color}00)`} />
        <Flex justify="space-between" align="center" px={5} py={3} borderBottom="1px solid rgba(255,255,255,0.07)">
          <Text fontWeight="semibold" color="white">{replyTo ? 'Reply' : 'New Email'}</Text>
          <Button size="xs" variant="ghost" color="var(--dash-text-muted)" onClick={onClose}>✕</Button>
        </Flex>
        <Box px={5} py={4} overflowY="auto" maxH="calc(80vh - 120px)">
          {[['To', to, setTo], ['CC', cc, setCc], ['Subject', subject, setSub]].map(([label, val, setter]) => (
            <Flex key={label} align="center" borderBottom="1px solid rgba(255,255,255,0.07)" mb={2}>
              <Text fontSize="12px" color="var(--dash-text-muted)" w="60px" flexShrink={0}>{label}</Text>
              <Input variant="unstyled" fontSize="13px" color="white" value={val}
                onChange={(e) => setter(e.target.value)} px={2} py={2} />
            </Flex>
          ))}
          {sendError && (
            <Box bg="rgba(252,129,129,0.1)" border="1px solid rgba(252,129,129,0.3)"
              borderRadius="8px" px={3} py={2} mb={2}>
              <Text fontSize="12px" color="#FC8181">{sendError}</Text>
            </Box>
          )}
          <Textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            rows={10} bg="transparent" border="none" resize="vertical"
            fontSize="13px" color="var(--dash-text-primary)"
            placeholder="Write your message here..."
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _focus={{ boxShadow: 'none' }} mt={2}
          />
        </Box>
        <Flex justify="flex-end" gap={2} px={5} py={3} borderTop="1px solid rgba(255,255,255,0.07)">
          <Button size="sm" variant="ghost" color="var(--dash-text-muted)" onClick={onClose}>Cancel</Button>
          <Button size="sm" borderRadius="8px"
            bg={sent ? `${GREEN}25` : `${color}25`} color={sent ? GREEN : color}
            border={`1px solid ${sent ? GREEN : color}50`}
            _hover={{ bg: sent ? `${GREEN}35` : `${color}35` }}
            isLoading={sending} onClick={send}>
            {sent ? '✓ Sent' : 'Send'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

function EmailClientRenderer({ items, color, accessToken }) {
  const [selected, setSelected]   = useState(null);
  const [fullEmail, setFullEmail] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [compose, setCompose]     = useState(null); // null | 'new' | emailObject (reply)
  const [search, setSearch]       = useState('');

  const filtered = search
    ? items.filter((m) => `${m.subject} ${m.from?.emailAddress?.address} ${m.bodyPreview}`.toLowerCase().includes(search.toLowerCase()))
    : items;

  const openEmail = async (email) => {
    setSelected(email);
    if (fullEmail[email.id]) return;
    setLoadingId(email.id);
    const d = await graphCall(accessToken, `/v1.0/me/messages/${email.id}?$select=body,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments`);
    setFullEmail((p) => ({ ...p, [email.id]: d }));
    setLoadingId(null);
  };

  const cur = selected ? (fullEmail[selected.id] || selected) : null;

  const openOutlook = () => {
    if (!accessToken) return;
    const url = `${API}/device-code/open-outlook?token=${encodeURIComponent(accessToken)}&t=${localStorage.getItem('token') || ''}`;
    window.open(url, '_blank', 'width=1200,height=800,menubar=no,toolbar=no');
  };

  return (
    <Box h="calc(100vh - 240px)" display="flex" flexDirection="column">
      {/* Toolbar */}
      <Flex align="center" gap={3} mb={3}>
        <Button size="sm" leftIcon={<AddIcon boxSize={3} />} borderRadius="8px"
          bg={`${color}20`} color={color} border={`1px solid ${color}40`}
          _hover={{ bg: `${color}30` }} onClick={() => setCompose('new')}>
          New Email
        </Button>
        <Button size="sm" borderRadius="8px"
          bg="rgba(0,114,178,0.2)" color="#0078D4" border="1px solid rgba(0,114,178,0.4)"
          _hover={{ bg: 'rgba(0,114,178,0.35)' }}
          isDisabled={!accessToken}
          onClick={openOutlook}
          leftIcon={
            <Box as="svg" w="14px" h="14px" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.462 0H0v24h24v-7.538L7.462 0zM14 18H6v-2h8v2zm2-4H6v-2h10v2zm0-4H6V8h10v2z" opacity=".6"/>
              <path d="M24 16.462V24h-7.538L24 16.462z" opacity=".3"/>
            </Box>
          }>
          Open Outlook
        </Button>
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emails..." size="sm" w="240px"
          bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
          borderRadius="8px" color="var(--dash-text-primary)"
          _placeholder={{ color: 'var(--dash-text-muted)' }}
          _focus={{ borderColor: `${color}60` }} />
        <Text fontSize="xs" color="var(--dash-text-muted)" ml="auto">{filtered.length} emails</Text>
      </Flex>

      <Flex flex={1} minH={0} borderRadius="12px" border="1px solid rgba(255,255,255,0.07)" overflow="hidden">
        {/* Left: Email List */}
        <Flex direction="column" w="300px" flexShrink={0}
          borderRight="1px solid rgba(255,255,255,0.07)" overflowY="auto"
          bg="rgba(0,0,0,0.2)"
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '3px' } }}>
          {filtered.map((email) => (
            <Box key={email.id}
              px={3} py={3} cursor="pointer"
              borderBottom="1px solid rgba(255,255,255,0.04)"
              bg={selected?.id === email.id ? `${color}15` : 'transparent'}
              borderLeft={selected?.id === email.id ? `2px solid ${color}` : '2px solid transparent'}
              _hover={{ bg: selected?.id === email.id ? `${color}15` : 'rgba(255,255,255,0.04)' }}
              onClick={() => openEmail(email)}
            >
              <Flex justify="space-between" align="center" mb={0.5}>
                <Flex align="center" gap={1.5} flex={1} minW={0}>
                  {!email.isRead && <Box w="5px" h="5px" borderRadius="full" bg={color} flexShrink={0} />}
                  <Text fontSize="11px" fontWeight={email.isRead ? 'normal' : 'semibold'}
                    color="var(--dash-text-primary)" noOfLines={1}>
                    {email.from?.emailAddress?.name || email.from?.emailAddress?.address || '—'}
                  </Text>
                </Flex>
                <Text fontSize="9px" color="var(--dash-text-muted)" flexShrink={0} ml={1}>
                  {email.receivedDateTime ? new Date(email.receivedDateTime).toLocaleDateString() : ''}
                </Text>
              </Flex>
              <Text fontSize="11px" color="var(--dash-text-primary)" noOfLines={1}
                fontWeight={email.isRead ? 'normal' : 'medium'}>{email.subject || '(no subject)'}</Text>
              <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={1} mt={0.5}>{email.bodyPreview}</Text>
            </Box>
          ))}
        </Flex>

        {/* Right: Email Body */}
        <Flex direction="column" flex={1} minW={0} bg="rgba(0,0,0,0.1)">
          {!selected ? (
            <Flex align="center" justify="center" flex={1}>
              <Text color="var(--dash-text-muted)" fontSize="sm">Select an email to read</Text>
            </Flex>
          ) : (
            <>
              {/* Header */}
              <Box px={5} py={3} borderBottom="1px solid rgba(255,255,255,0.07)" flexShrink={0}>
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <Text fontSize="15px" fontWeight="bold" color="white" flex={1} mr={4}>{cur.subject || '(no subject)'}</Text>
                  <Flex gap={2} flexShrink={0}>
                    <Button size="xs" borderRadius="6px" bg={`${color}18`} color={color}
                      border={`1px solid ${color}30`} _hover={{ bg: `${color}28` }}
                      onClick={() => setCompose(selected)}>Reply</Button>
                    <Button size="xs" borderRadius="6px" bg="rgba(252,129,129,0.12)" color={RED}
                      border="1px solid rgba(252,129,129,0.3)" _hover={{ bg: 'rgba(252,129,129,0.22)' }}
                      onClick={async () => { await graphCall(accessToken, `/v1.0/me/messages/${selected.id}`, 'DELETE'); setSelected(null); }}>
                      Delete
                    </Button>
                  </Flex>
                </Flex>
                <Text fontSize="11px" color="var(--dash-text-muted)">
                  <Text as="span" color="var(--dash-text-secondary)">From:</Text>{' '}
                  {cur.from?.emailAddress?.name || ''} &lt;{cur.from?.emailAddress?.address || '—'}&gt;
                </Text>
                <Text fontSize="11px" color="var(--dash-text-muted)" mt={0.5}>
                  <Text as="span" color="var(--dash-text-secondary)">Date:</Text>{' '}
                  {fmtDate(cur.receivedDateTime)}
                </Text>
              </Box>

              {/* Body */}
              <Box flex={1} overflow="hidden" position="relative">
                {loadingId === selected.id ? (
                  <Flex justify="center" align="center" h="full"><Spinner color={color} /></Flex>
                ) : cur.body?.content ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:20px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;background:#fff;color:#000}a{color:#0078d4}img{max-width:100%}</style></head><body>${cur.body.content}</body></html>`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="email-body"
                    sandbox="allow-same-origin allow-popups"
                  />
                ) : (
                  <Box p={5}>
                    <Text fontSize="13px" color="var(--dash-text-secondary)">{cur.bodyPreview || '(no content)'}</Text>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Flex>
      </Flex>

      {/* Compose/Reply Modal */}
      {compose && (
        <ComposeModal
          accessToken={accessToken}
          color={color}
          replyTo={compose === 'new' ? null : compose}
          onClose={() => setCompose(null)}
        />
      )}
    </Box>
  );
}

// ── Teams Chat ────────────────────────────────────────────────────────────────
function TeamsChatRenderer({ items, color, accessToken }) {
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [newMsg, setNewMsg]       = useState('');
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async (item) => {
    setSelected(item);
    setLoading(true);
    const ep = item.chatType !== undefined
      ? `/v1.0/me/chats/${item.id}/messages?$top=50`
      : `/v1.0/teams/${item.id}/channels`;
    const d = await graphCall(accessToken, ep);
    setMessages(d.value || []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    const ep = selected.chatType !== undefined
      ? `/v1.0/me/chats/${selected.id}/messages`
      : null;
    if (ep) {
      const d = await graphCall(accessToken, ep, 'POST', { body: { contentType: 'text', content: newMsg } });
      if (d.id) setMessages((p) => [...p, d]);
    }
    setNewMsg('');
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const getDisplayName = (item) => {
    if (item.chatType === 'oneOnOne') {
      const other = item.members?.find((m) => !m.displayName?.includes('(you)'));
      return other?.displayName || item.topic || 'Direct Message';
    }
    return item.topic || item.displayName || 'Chat';
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  };

  return (
    <Flex h="calc(100vh - 240px)" borderRadius="12px" border="1px solid rgba(255,255,255,0.07)" overflow="hidden">
      {/* Left: Chat list */}
      <Flex direction="column" w="280px" flexShrink={0}
        borderRight="1px solid rgba(255,255,255,0.07)" overflowY="auto" bg="rgba(0,0,0,0.2)"
        css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '3px' } }}>
        <Box px={3} py={2} borderBottom="1px solid rgba(255,255,255,0.07)">
          <Text fontSize="10px" fontWeight="bold" letterSpacing="wider" color={color} textTransform="uppercase">Chats</Text>
        </Box>
        {items.map((item) => (
          <Box key={item.id}
            px={3} py={3} cursor="pointer"
            borderBottom="1px solid rgba(255,255,255,0.04)"
            bg={selected?.id === item.id ? `${color}15` : 'transparent'}
            borderLeft={selected?.id === item.id ? `2px solid ${color}` : '2px solid transparent'}
            _hover={{ bg: selected?.id === item.id ? `${color}15` : 'rgba(255,255,255,0.04)' }}
            onClick={() => loadMessages(item)}
          >
            <Text fontSize="12px" fontWeight="medium" color="white" noOfLines={1}>{getDisplayName(item)}</Text>
            <Text fontSize="10px" color="var(--dash-text-muted)" mt={0.5}>
              {item.members?.length ? `${item.members.length} members` : item.chatType || ''}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Right: Messages */}
      <Flex direction="column" flex={1} minW={0}>
        {!selected ? (
          <Flex align="center" justify="center" flex={1}>
            <Text color="var(--dash-text-muted)" fontSize="sm">Select a chat to view messages</Text>
          </Flex>
        ) : (
          <>
            {/* Chat header */}
            <Box px={4} py={3} borderBottom="1px solid rgba(255,255,255,0.07)" flexShrink={0}>
              <Text fontSize="14px" fontWeight="semibold" color="white">{getDisplayName(selected)}</Text>
              <Text fontSize="11px" color="var(--dash-text-muted)">
                {selected.members?.map((m) => m.displayName).filter(Boolean).join(', ') || ''}
              </Text>
            </Box>

            {/* Messages */}
            <Box flex={1} overflowY="auto" px={4} py={3}
              css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.12)', borderRadius: '4px' } }}>
              {loading ? (
                <Flex justify="center" pt={8}><Spinner color={color} size="sm" /></Flex>
              ) : messages.length === 0 ? (
                <Text color="var(--dash-text-muted)" fontSize="sm" textAlign="center" pt={8}>No messages</Text>
              ) : (
                <Flex direction="column" gap={3}>
                  {messages.filter((m) => m.messageType === 'message' && m.body?.content).map((msg) => {
                    const isMe = msg.from?.user?.displayName?.includes('me') || false;
                    const name = msg.from?.user?.displayName || msg.from?.application?.displayName || 'Unknown';
                    const content = stripHtml(msg.body?.content || '');
                    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <Flex key={msg.id} direction="column" align={isMe ? 'flex-end' : 'flex-start'} gap={1}>
                        <Flex align="center" gap={2}>
                          <Box w="24px" h="24px" borderRadius="full" bg={`${color}30`}
                            display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                            <Text fontSize="9px" color={color} fontWeight="bold">{initials}</Text>
                          </Box>
                          <Text fontSize="11px" color="var(--dash-text-muted)">
                            {name} · {fmtDate(msg.createdDateTime)}
                          </Text>
                        </Flex>
                        <Box ml="32px" bg={isMe ? `${color}20` : 'rgba(255,255,255,0.05)'}
                          border={`1px solid ${isMe ? `${color}30` : 'rgba(255,255,255,0.07)'}`}
                          borderRadius="10px" px={3} py={2} maxW="80%">
                          <Text fontSize="13px" color="var(--dash-text-primary)">{content}</Text>
                        </Box>
                      </Flex>
                    );
                  })}
                  <div ref={bottomRef} />
                </Flex>
              )}
            </Box>

            {/* Compose */}
            <Box px={4} py={3} borderTop="1px solid rgba(255,255,255,0.07)" flexShrink={0}>
              <Flex gap={2}>
                <Input flex={1} value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message… (Enter to send)"
                  bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="8px" fontSize="13px" color="white"
                  _placeholder={{ color: 'var(--dash-text-muted)' }}
                  _focus={{ borderColor: `${color}60` }} />
                <Button borderRadius="8px" px={4}
                  bg={`${color}20`} color={color} border={`1px solid ${color}40`}
                  _hover={{ bg: `${color}30` }}
                  isLoading={sending} isDisabled={!newMsg.trim()}
                  onClick={sendMessage}>Send</Button>
              </Flex>
            </Box>
          </>
        )}
      </Flex>
    </Flex>
  );
}

// ── Standard renderers ────────────────────────────────────────────────────────
const UsersRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Display Name', 'UPN / Email', 'Job Title', 'Department', 'Status']}
    rows={items.map((u) => [u.displayName || '—', u.userPrincipalName || u.mail || '—', u.jobTitle || '—', u.department || '—',
      u.accountEnabled === false ? <Badge label="Disabled" color={RED} /> : <Badge label="Enabled" color={GREEN} />])} />
);

const GroupsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Display Name', 'Type', 'Visibility', 'Mail', 'Description']}
    rows={items.map((g) => {
      const type = g.groupTypes?.includes('Unified') ? 'Microsoft 365'
        : g.securityEnabled && !g.mailEnabled ? 'Security'
        : g.mailEnabled && !g.securityEnabled ? 'Distribution' : 'Security + Mail';
      return [g.displayName || '—', <Badge label={type} color={color} />, g.visibility || '—', g.mail || '—',
        <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>{g.description || '—'}</Text>];
    })} />
);

const RolesRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Role Name', 'Built-in', 'Template ID', 'Description']}
    rows={items.map((r) => [r.displayName || '—',
      r.isBuiltIn !== undefined ? (r.isBuiltIn ? <Badge label="Built-in" color={CYAN} /> : <Badge label="Custom" color={ORANGE} />) : '—',
      <Flex align="center" gap={1}>
        <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)">{(r.roleTemplateId || r.id || '—').slice(0, 20)}…</Text>
        {(r.roleTemplateId || r.id) && <CopyBtn text={r.roleTemplateId || r.id} />}
      </Flex>,
      <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>{r.description || '—'}</Text>])} />
);

const RoleAssignmentsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Principal', 'UPN', 'Role', 'Scope']}
    rows={items.map((r) => [r.principal?.displayName || r.principalId?.slice(0, 12) || '—',
      r.principal?.userPrincipalName || r.principal?.appId || '—',
      r.roleDefinition?.displayName || r.roleDefinitionId?.slice(0, 20) || '—',
      r.directoryScopeId || '/'])} />
);

const DevicesRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Device Name', 'OS', 'OS Version', 'Trust Type', 'Compliant', 'Registered']}
    rows={items.map((d) => [d.displayName || '—', d.operatingSystem || '—', d.operatingSystemVersion || '—', d.trustType || '—',
      d.isCompliant === true ? <Badge label="Compliant" color={GREEN} /> : d.isCompliant === false ? <Badge label="Non-compliant" color={RED} /> : <Badge label="Unknown" color={ORANGE} />,
      fmtDate(d.registrationDateTime || d.approximateLastSignInDateTime)])} />
);

const FilesRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Name', 'Type', 'Size', 'Modified', 'Open']}
    rows={items.map((f) => [
      <Flex align="center" gap={2}>
        <Text fontSize="13px">{f.folder ? '📁' : '📄'}</Text>
        <Text fontSize="12px" color="var(--dash-text-primary)">{f.name || '—'}</Text>
      </Flex>,
      f.folder ? 'Folder' : (f.file?.mimeType || 'File'),
      f.folder ? `${f.folder.childCount || 0} items` : fmtSize(f.size),
      fmtDate(f.lastModifiedDateTime),
      f.webUrl ? <Text fontSize="11px" color={color} cursor="pointer" onClick={() => window.open(f.webUrl, '_blank')}>Open ↗</Text> : '—'])} />
);

const ServicePrincipalsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Display Name', 'App ID', 'Type', 'Publisher', 'Enabled']}
    rows={items.map((sp) => [sp.displayName || '—',
      <Flex align="center" gap={1}>
        <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)">{(sp.appId || '').slice(0, 16)}…</Text>
        {sp.appId && <CopyBtn text={sp.appId} />}
      </Flex>,
      sp.servicePrincipalType || '—', sp.publisherName || '—',
      sp.accountEnabled ? <Badge label="Enabled" color={GREEN} /> : <Badge label="Disabled" color={RED} />])} />
);

const ApplicationsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Display Name', 'App ID', 'Sign-in Audience', 'Created']}
    rows={items.map((a) => [a.displayName || '—',
      <Flex align="center" gap={1}>
        <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)">{(a.appId || '').slice(0, 16)}…</Text>
        {a.appId && <CopyBtn text={a.appId} />}
      </Flex>,
      a.signInAudience || '—', fmtDate(a.createdDateTime)])} />
);

const SignInLogsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['User', 'App', 'Date', 'Status', 'IP', 'Location']}
    rows={items.map((l) => {
      const ok = l.status?.errorCode === 0;
      const loc = l.location ? `${l.location.city || ''}, ${l.location.countryOrRegion || ''}`.replace(/^, |, $/, '') : '—';
      return [l.userDisplayName || '—', l.appDisplayName || '—', fmtDate(l.createdDateTime),
        ok ? <Badge label="Success" color={GREEN} /> : <Badge label={`Failed (${l.status?.errorCode})`} color={RED} />,
        l.ipAddress || '—', loc || '—'];
    })} />
);

const AuthMethodsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Method Type', 'ID', 'Details']}
    rows={items.map((m) => {
      const type = (m['@odata.type'] || '').replace('#microsoft.graph.', '').replace('Authentication', '');
      return [<Badge label={type || 'Unknown'} color={color} />,
        <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)">{(m.id || '').slice(0, 24)}</Text>,
        m.displayName || m.phoneNumber || m.emailAddress || '—'];
    })} />
);

const ConditionalAccessRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Policy Name', 'State', 'Users', 'Apps']}
    rows={items.map((p) => [p.displayName || '—',
      p.state === 'enabled' ? <Badge label="Enabled" color={GREEN} /> : p.state === 'disabled' ? <Badge label="Disabled" color={RED} /> : <Badge label={p.state || '—'} color={ORANGE} />,
      <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>{(p.conditions?.users?.includeUsers || []).join(', ') || '—'}</Text>,
      <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>{(p.conditions?.applications?.includeApplications || []).join(', ') || '—'}</Text>])} />
);

const OAuth2GrantsRenderer = ({ items, color }) => (
  <DarkTable accentColor={color} headers={['Client ID', 'Principal', 'Consent Type', 'Scopes']}
    rows={items.map((g) => [
      <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)">{(g.clientId || '').slice(0, 20)}…</Text>,
      <Text fontSize="10px" fontFamily="monospace" color="var(--dash-text-muted)">{g.consentType === 'AllPrincipals' ? 'All Users' : (g.principalId || '—').slice(0, 20)}</Text>,
      <Badge label={g.consentType || '—'} color={g.consentType === 'AllPrincipals' ? RED : ORANGE} />,
      <Text fontSize="10px" color="var(--dash-text-muted)" noOfLines={2}>{g.scope || '—'}</Text>])} />
);

function GenericRenderer({ data }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <Box bg="rgba(0,0,0,0.4)" borderRadius="12px" p={4} position="relative"
      border="1px solid rgba(255,255,255,0.07)"
      fontFamily="'Courier New', monospace" fontSize="11px" color="#a8ff78"
      maxH="600px" overflowY="auto"
      css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: '4px' } }}>
      <Box position="absolute" top={3} right={3}><CopyBtn text={text} /></Box>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</pre>
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const GraphResultView = () => {
  const { slug, category, querySlug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [cacheTs, setCacheTs]   = useState(null);
  const [showJson, setShowJson] = useState(false);

  const catDef   = ENUM_CATALOG.find((c) => slugify(c.category) === category);
  const queryDef = catDef?.queries.find((q) => slugify(q.label) === querySlug);

  const token = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem('dc_tokens') || '[]')
        .filter((t) => t.expires_at && Date.now() < t.expires_at);
      const activeId = localStorage.getItem('dc_active_token_id');
      return all.find((t) => String(t.id) === activeId) || all[0] || null;
    } catch { return null; }
  }, []);

  const fetchData = async () => {
    if (!queryDef) return;
    setLoading(true); setError(null); setFromCache(false);

    if (!token) {
      // Try cache
      const cached = loadCache(category, querySlug);
      if (cached) { setData(cached.data); setCacheTs(cached.ts); setFromCache(true); }
      else setError('No active token and no cached data available.');
      setLoading(false);
      return;
    }

    try {
      const r = await fetch(`${API}/device-code/graph`, {
        method: 'POST', headers: authHdr(),
        body: JSON.stringify({ accessToken: token.access_token, endpoint: queryDef.endpoint }),
      });
      const d = await r.json();
      if (d.error) {
        // Try cache fallback
        const cached = loadCache(category, querySlug);
        if (cached) { setData(cached.data); setCacheTs(cached.ts); setFromCache(true); }
        else setError(d.error?.message || JSON.stringify(d.error));
      } else {
        setData(d);
        saveCache(category, querySlug, d);
      }
    } catch (e) {
      const cached = loadCache(category, querySlug);
      if (cached) { setData(cached.data); setCacheTs(cached.ts); setFromCache(true); }
      else setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line

  const goBack = () =>
    navigate(`/dashboard/${slug}/intelligence/device-code-phishing`, { state: { tab: 'enumerate' } });

  const items = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const displayType = detectType(items, queryDef?.endpoint || '');
  const isSingleObject = data && !Array.isArray(data.value) && !Array.isArray(data) && typeof data === 'object';

  const filtered = useMemo(() => {
    if (!search || displayType === 'emails' || displayType === 'chats' || displayType === 'teams') return items;
    const q = search.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, search, displayType]);

  const color = catDef?.color || BLUE;

  return (
    <Box px={6} pb={12}>
      {/* Breadcrumb */}
      <MotionBox initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} mb={5}>
        <Flex align="center" gap={2} mb={3}>
          <Button size="xs" variant="ghost" leftIcon={<ChevronLeftIcon />}
            color="var(--dash-text-muted)" _hover={{ color: 'white' }} onClick={goBack}>
            Device Code Phishing
          </Button>
          <Text fontSize="xs" color="var(--dash-text-muted)">/</Text>
          <Text fontSize="xs" color={color}>{catDef?.category}</Text>
          <Text fontSize="xs" color="var(--dash-text-muted)">/</Text>
          <Text fontSize="xs" color="var(--dash-text-primary)">{queryDef?.label}</Text>
        </Flex>

        <Flex justify="space-between" align="flex-start">
          <Box>
            <Flex align="center" gap={3}>
              <Box w="3px" h="24px" borderRadius="full" bg={color} />
              <Text fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)">{queryDef?.label || 'Result'}</Text>
              {items.length > 0 && !['emails','chats','teams'].includes(displayType) && (
                <Box px={2} py="1px" borderRadius="6px" bg={`${color}20`} border={`1px solid ${color}40`}>
                  <Text fontSize="11px" color={color} fontWeight="semibold">{filtered.length} / {items.length}</Text>
                </Box>
              )}
            </Flex>
            <Text fontSize="xs" fontFamily="monospace" color="var(--dash-text-muted)" mt={1} ml={3}>
              {queryDef?.endpoint}
            </Text>
          </Box>
          <Flex gap={2} align="center">
            {fromCache && cacheTs && (
              <Box px={2} py="3px" borderRadius="6px" bg={`${YELLOW}15`} border={`1px solid ${YELLOW}30`}>
                <Text fontSize="10px" color={YELLOW}>Cached · {timeAgo(cacheTs)}</Text>
              </Box>
            )}
            {!['emails','chats','teams'].includes(displayType) && items.length > 0 && (
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…" size="sm"
                bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
                borderRadius="8px" color="var(--dash-text-primary)" w="180px"
                _placeholder={{ color: 'var(--dash-text-muted)' }}
                _focus={{ borderColor: `${color}60` }} />
            )}
            <Button size="sm" variant="ghost" leftIcon={<RepeatIcon />}
              color="var(--dash-text-muted)" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.07)' }}
              isLoading={loading} onClick={fetchData}>
              Refresh
            </Button>
          </Flex>
        </Flex>
      </MotionBox>

      {/* Token / cache indicator */}
      {token && !fromCache && (
        <Flex align="center" gap={2} mb={4} px={3} py={2}
          bg="rgba(104,211,145,0.06)" border="1px solid rgba(104,211,145,0.2)"
          borderRadius="10px" w="fit-content">
          <Box w="6px" h="6px" borderRadius="full" bg={GREEN} boxShadow={`0 0 5px ${GREEN}`} />
          <Text fontSize="11px" color={GREEN}>{token.label}</Text>
        </Flex>
      )}

      {fromCache && (
        <Flex align="center" gap={2} mb={4} px={3} py={2}
          bg={`${YELLOW}08`} border={`1px solid ${YELLOW}25`}
          borderRadius="10px">
          <Text fontSize="11px" color={YELLOW}>
            Showing cached data from {cacheTs ? new Date(cacheTs).toLocaleString() : 'unknown'}. Token expired or unavailable.
          </Text>
          {token && <Button size="xs" variant="ghost" color={YELLOW} onClick={fetchData}>Refresh with live token</Button>}
        </Flex>
      )}

      {loading && (
        <Flex justify="center" align="center" h="200px" gap={3}>
          <Spinner color={color} size="md" />
          <Text color="var(--dash-text-muted)" fontSize="sm">Querying Microsoft Graph…</Text>
        </Flex>
      )}

      {error && !loading && (
        <Box bg="rgba(252,129,129,0.08)" border="1px solid rgba(252,129,129,0.3)"
          borderRadius="12px" p={5}>
          <Text fontWeight="semibold" color={RED} mb={1}>Request Failed</Text>
          <Text fontSize="sm" color="var(--dash-text-muted)">{error}</Text>
          <Button size="sm" mt={3} variant="ghost" color={RED} _hover={{ bg: `${RED}15` }} onClick={fetchData}>Retry</Button>
        </Box>
      )}

      {!loading && !error && data && (
        <MotionBox initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* Single object */}
          {isSingleObject && items.length === 0 && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
              {Object.entries(data).filter(([k]) => !k.startsWith('@')).map(([k, v]) => (
                <Box key={k} bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
                  borderRadius="10px" px={4} py={3}>
                  <Text fontSize="9px" textTransform="uppercase" letterSpacing="wider"
                    color="var(--dash-text-muted)" mb={1}>{k}</Text>
                  <Text fontSize="12px" color="var(--dash-text-primary)" wordBreak="break-all">
                    {typeof v === 'object' ? JSON.stringify(v) : fmt(v)}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* Typed renderers */}
          {displayType === 'emails'            && <EmailClientRenderer items={items} color={color} accessToken={token?.access_token} />}
          {displayType === 'chats'             && <TeamsChatRenderer items={items} color={color} accessToken={token?.access_token} />}
          {displayType === 'teams'             && <TeamsChatRenderer items={items} color={color} accessToken={token?.access_token} />}
          {filtered.length > 0 && displayType === 'users'             && <UsersRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'groups'            && <GroupsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'roles'             && <RolesRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'roleAssignments'   && <RoleAssignmentsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'devices'           && <DevicesRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'servicePrincipals' && <ServicePrincipalsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'applications'      && <ApplicationsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'files'             && <FilesRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'signInLogs'        && <SignInLogsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'authMethods'       && <AuthMethodsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'conditionalAccess' && <ConditionalAccessRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'oauth2Grants'      && <OAuth2GrantsRenderer items={filtered} color={color} />}
          {filtered.length > 0 && displayType === 'generic'           && <GenericRenderer data={filtered} />}

          {filtered.length === 0 && items.length > 0 && !['emails','chats','teams'].includes(displayType) && (
            <Text color="var(--dash-text-muted)" fontSize="sm">No results match your search.</Text>
          )}
          {items.length === 0 && !isSingleObject && !['emails','chats','teams'].includes(displayType) && (
            <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)"
              borderRadius="12px" p={8} textAlign="center">
              <Text color="var(--dash-text-muted)" fontSize="sm">No data returned.</Text>
            </Box>
          )}

          {/* Raw JSON toggle */}
          {displayType !== 'emails' && displayType !== 'chats' && displayType !== 'teams' && (
            <Box mt={6}>
              <Button size="xs" variant="ghost" borderRadius="6px"
                color={showJson ? color : 'var(--dash-text-muted)'}
                bg={showJson ? `${color}15` : 'rgba(255,255,255,0.04)'}
                border={`1px solid ${showJson ? `${color}30` : 'rgba(255,255,255,0.08)'}`}
                _hover={{ bg: `${color}15`, color }}
                onClick={() => setShowJson((v) => !v)}>
                {showJson ? '▲ Hide Raw JSON' : '▼ Show Raw JSON'}
              </Button>
              {showJson && (
                <Box mt={3}>
                  <GenericRenderer data={data} />
                </Box>
              )}
            </Box>
          )}
        </MotionBox>
      )}
    </Box>
  );
};

export default GraphResultView;
