export const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ENUM_CATALOG = [
  {
    category: 'Identity', color: '#63B3ED',
    queries: [
      { label: 'Who Am I',               endpoint: '/v1.0/me' },
      { label: 'All Users',              endpoint: '/v1.0/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,createdDateTime&$top=999' },
      { label: 'My Manager',             endpoint: '/v1.0/me/manager' },
      { label: 'My Direct Reports',      endpoint: '/v1.0/me/directReports' },
      { label: 'My Auth Methods (MFA)',  endpoint: '/v1.0/me/authentication/methods' },
      { label: 'Conditional Access',     endpoint: '/v1.0/identity/conditionalAccess/policies' },
      { label: 'Named Locations',        endpoint: '/v1.0/identity/conditionalAccess/namedLocations' },
    ],
  },
  {
    category: 'Groups & Roles', color: '#9F7AEA',
    queries: [
      { label: 'All Groups',             endpoint: '/v1.0/groups?$top=999' },
      { label: 'My Group Memberships',   endpoint: '/v1.0/me/memberOf' },
      { label: 'Directory Roles',        endpoint: '/v1.0/directoryRoles' },
      { label: 'Role Assignments',       endpoint: '/v1.0/roleManagement/directory/roleAssignments?$expand=principal,roleDefinition&$top=999' },
      { label: 'Privileged Role Members',endpoint: '/v1.0/directoryRoles?$expand=members' },
    ],
  },
  {
    category: 'Apps & Perms', color: '#F6AD55',
    queries: [
      { label: 'Service Principals',     endpoint: '/v1.0/servicePrincipals?$top=999' },
      { label: 'App Registrations',      endpoint: '/v1.0/applications?$top=999' },
      { label: 'OAuth2 Grants',          endpoint: '/v1.0/oauth2PermissionGrants?$top=999' },
      { label: 'My App Permissions',     endpoint: '/v1.0/me/appRoleAssignments' },
    ],
  },
  {
    category: 'Devices', color: '#76E4F7',
    queries: [
      { label: 'All Devices',            endpoint: '/v1.0/devices?$top=999' },
      { label: 'My Registered Devices',  endpoint: '/v1.0/me/registeredDevices' },
      { label: 'My Owned Devices',       endpoint: '/v1.0/me/ownedDevices' },
    ],
  },
  {
    category: 'Mail & Files', color: '#68D391',
    queries: [
      { label: 'Latest 25 Emails',       endpoint: '/v1.0/me/messages?$top=25&$select=subject,from,receivedDateTime,bodyPreview,isRead' },
      { label: 'My OneDrive Root',       endpoint: '/v1.0/me/drive/root/children' },
      { label: 'Recent Files',           endpoint: '/v1.0/me/drive/recent' },
      { label: 'Files Shared With Me',   endpoint: '/v1.0/me/drive/sharedWithMe' },
      { label: 'SharePoint Sites',       endpoint: '/v1.0/sites?search=*&$top=50' },
    ],
  },
  {
    category: 'Teams', color: '#5865F2',
    queries: [
      { label: 'My Teams',               endpoint: '/v1.0/me/joinedTeams' },
      { label: 'My Chats',               endpoint: '/v1.0/me/chats?$expand=members' },
    ],
  },
  {
    category: 'Security', color: '#FC8181',
    queries: [
      { label: 'Sign-in Logs',           endpoint: '/v1.0/auditLogs/signIns?$top=50' },
      { label: 'Risk Detections',        endpoint: '/v1.0/identityProtection/riskDetections?$top=50' },
      { label: 'Security Alerts',        endpoint: '/v1.0/security/alerts?$top=50' },
      { label: 'Auth Methods Policy',    endpoint: '/v1.0/policies/authenticationMethodsPolicy' },
    ],
  },
];
