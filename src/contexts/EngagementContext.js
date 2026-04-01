import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const EngagementContext = createContext();
export const useEngagements = () => useContext(EngagementContext);

const USERS_API = 'http://localhost:5000/api/users/all';

// ── Helpers ──────────────────────────────────────────────────────────────────
export const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ADJECTIVES = [
  'Phantom', 'Shadow', 'Crimson', 'Iron', 'Midnight', 'Obsidian',
  'Scarlet', 'Silent', 'Electric', 'Frozen', 'Burning', 'Hollow',
  'Broken', 'Silver', 'Steel', 'Void', 'Neon', 'Quantum', 'Apex',
  'Cipher', 'Venom', 'Glacial', 'Abyssal', 'Infernal', 'Spectral',
];
const NOUNS = [
  'Vortex', 'Tempest', 'Phoenix', 'Raven', 'Serpent', 'Hydra',
  'Basilisk', 'Mirage', 'Paradox', 'Oracle', 'Vector', 'Titan',
  'Wraith', 'Falcon', 'Reaper', 'Eclipse', 'Protocol', 'Circuit',
  'Terminus', 'Harbinger', 'Revenant', 'Leviathan', 'Nemesis', 'Axiom',
];

export const generateOperationName = () => {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `Operation ${adj} ${noun}`;
};

const STATUS_ORDER = ['PREPARING', 'IN PROGRESS', 'REPORTING', 'COMPLETED', 'PAUSED'];
const ACTIVE_STATUSES = ['PREPARING', 'IN PROGRESS', 'REPORTING'];

const API = 'http://localhost:5000/api/engagements';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const normalize = (eng) => ({ ...eng, id: eng._id || eng.id });

// ── Provider ─────────────────────────────────────────────────────────────────
export const EngagementProvider = ({ children }) => {
  const [engagements, setEngagements] = useState([]);
  const [allUsers,    setAllUsers]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Helper: look up a user by their _id string
  const getUserById = useCallback(
    (id) => allUsers.find((u) => String(u.id) === String(id)) || null,
    [allUsers]
  );

  const fetchEngagements = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const [engRes, usersRes] = await Promise.all([
        fetch(API,        { headers: authHeaders() }),
        fetch(USERS_API,  { headers: authHeaders() }),
      ]);
      if (engRes.ok) {
        setEngagements((await engRes.json()).map(normalize));
      } else {
        console.error('[EngagementContext] engagements fetch failed:', engRes.status, await engRes.text());
      }
      if (usersRes.ok) {
        setAllUsers(await usersRes.json());
      } else {
        console.error('[EngagementContext] users fetch failed:', usersRes.status, await usersRes.text());
      }
    } catch (err) {
      console.error('[EngagementContext] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEngagements(); }, [fetchEngagements]);

  const addEngagement = useCallback(async (form) => {
    const res = await fetch(API, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(form),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Create failed');
    const eng = normalize(await res.json());
    setEngagements((prev) => [eng, ...prev]);
    return eng;
  }, []);

  const updateEngagement = useCallback(async (id, updates) => {
    const res = await fetch(`${API}/${id}`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify(updates),
    });
    if (!res.ok) return;
    const updated = normalize(await res.json());
    setEngagements((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteEngagement = useCallback(async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() });
    setEngagements((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getBySlug = useCallback(
    (slug) => engagements.find((e) => e.slug === slug) || null,
    [engagements],
  );

  // ── Computed dashboard stats ─────────────────────────────────────────────
  const dashboardStats = useMemo(() => {
    const activeEngagements = engagements.filter((e) => ACTIVE_STATUSES.includes(e.status));
    const allMyEngagements  = [...engagements].sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    );

    // Soonest-closing active engagement
    const withDates = activeEngagements
      .filter((e) => e.endDate)
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    const soonestClosing = withDates[0] || null;
    const daysToClose = soonestClosing
      ? Math.ceil((new Date(soonestClosing.endDate) - new Date()) / 86400000)
      : null;

    // Findings across all engagements
    const allFindings = engagements.flatMap((e) => e.findings || []);
    const findingsBySeverity = allFindings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {});

    // Operator deployment — based on real users from DB
    const deployedIds = new Set(
      activeEngagements.flatMap((e) => e.operators || []).map(String)
    );
    const deployedOperators = allUsers.filter((u) => deployedIds.has(String(u.id)));
    const standbyOperators  = allUsers.filter((u) => !deployedIds.has(String(u.id)));

    // Activity logs across all engagements (newest first)
    const activityLogs = engagements
      .flatMap((e) =>
        (e.activityLog || []).map((log) => ({
          ...log,
          engagementName: e.name,
          engagementSlug: e.slug,
        }))
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // Resources — aggregate by name across all engagements
    const resourceMap = {};
    engagements.forEach((e) => {
      (e.resources || []).forEach((r) => {
        if (!resourceMap[r.name]) {
          resourceMap[r.name] = { name: r.name, used: 0, total: 0, color: r.color };
        }
        resourceMap[r.name].used  += r.used;
        resourceMap[r.name].total += r.total;
      });
    });
    const resources = Object.values(resourceMap).filter((r) => r.total > 0);

    // Team skills — auto-computed from operatorSkills per engagement
    const skillMap = {};
    engagements.forEach((e) => {
      const ops = (e.operators || []).map(String);
      const opSkills = e.operatorSkills || {};
      if (ops.length === 0) return;
      // Collect all unique skills across operators in this engagement
      const engSkills = new Set();
      ops.forEach((uid) => {
        (opSkills[uid] || []).forEach((s) => engSkills.add(s));
      });
      // Calculate coverage per skill: how many operators have it / total operators
      engSkills.forEach((skill) => {
        const count = ops.filter((uid) => (opSkills[uid] || []).includes(skill)).length;
        const pct = Math.round((count / ops.length) * 100);
        // Keep the highest coverage across engagements
        if (skillMap[skill] === undefined || pct > skillMap[skill]) {
          skillMap[skill] = pct;
        }
      });
    });
    const teamSkills = Object.entries(skillMap)
      .map(([label, pct]) => ({ label, pct }))
      .sort((a, b) => b.pct - a.pct);

    return {
      activeEngagements: allMyEngagements,
      activeCount:       activeEngagements.length,
      soonestClosing,
      daysToClose,
      totalFindings:     allFindings.length,
      findingsBySeverity,
      deployedOperators,
      standbyOperators,
      activityLogs,
      resources,
      teamSkills,
    };
  }, [engagements, allUsers]);

  return (
    <EngagementContext.Provider
      value={{
        engagements,
        allUsers,
        getUserById,
        loading,
        dashboardStats,
        addEngagement,
        updateEngagement,
        deleteEngagement,
        getBySlug,
        fetchEngagements,
        STATUS_ORDER,
      }}
    >
      {children}
    </EngagementContext.Provider>
  );
};
