import { useState, useRef, useEffect } from 'react';
import {
  Box, Flex, Text, Heading, Button, IconButton, Input, Select, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalBody,
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon, CloseIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagements } from '../../../contexts/EngagementContext';
import { useAuth } from '../../../contexts/AuthContext';

const MotionBox = motion(Box);

// ── Constants ──────────────────────────────────────────────────────────────────
const HOUR_H     = 56; // px per hour slot
const HOURS      = Array.from({ length: 24 }, (_, i) => i);
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS     = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const EC = {
  task:    { bg: 'rgba(99,102,241,0.18)',  border: 'rgba(99,102,241,0.45)',  text: '#a5b4fc', solid: '#6366f1' },
  blocker: { bg: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.45)',  text: '#fcd34d', solid: '#f59e0b' },
};

// ── Date helpers ───────────────────────────────────────────────────────────────
const pad         = (n)    => String(n).padStart(2, '0');
const toDateStr   = (d)    => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays     = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const getWeekStart = (d)   => {
  const x   = new Date(d);
  const dow = x.getDay();
  x.setDate(x.getDate() - (dow === 0 ? 6 : dow - 1));
  x.setHours(0, 0, 0, 0);
  return x;
};
const fmtDate = (str) => {
  const [y, m, d] = str.split('-');
  return `${d} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};
const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const minToPx = (m) => (m / 60) * HOUR_H;

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputStyles = {
  variant: 'unstyled',
  bg: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  px: 4, h: '40px', fontSize: 'sm',
  color: 'var(--dash-text-primary)',
  _placeholder: { color: 'var(--dash-text-muted)' },
  _hover: { border: '1px solid rgba(255,80,95,0.4)' },
  _focus: { border: '1px solid rgba(255,80,95,0.7)', boxShadow: '0 0 0 1px rgba(255,80,95,0.3)' },
};
const selectStyles = {
  bg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: '10px', h: '40px', fontSize: 'sm', color: 'var(--dash-text-primary)',
  cursor: 'pointer', focusBorderColor: 'rgba(255,80,95,0.7)',
  _hover: { borderColor: 'rgba(255,80,95,0.4)' },
  sx: { '& option': { background: '#1a1a1f !important' } },
};
const Label = ({ children }) => (
  <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="uppercase"
    letterSpacing="wider" fontWeight="semibold" mb={1}>{children}</Text>
);

const BLANK_FORM = { type: 'task', title: '', startTime: '', endTime: '', operatorId: '' };

// ── Component ──────────────────────────────────────────────────────────────────
const CalendarView = () => {
  const { slug }    = useParams();
  const { getBySlug, updateEngagement, getUserById } = useEngagements();
  const { user: currentUser } = useAuth();
  const eng = getBySlug(slug);

  const today   = new Date();
  const gridRef = useRef(null);

  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [addModal,  setAddModal]  = useState(null);   // { date, startTime }
  const [detail,    setDetail]    = useState(null);
  const [form,      setForm]      = useState(BLANK_FORM);

  // Overview state
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');   // 'all' | 'task' | 'blocker'
  const [filterTime, setFilterTime] = useState('all');   // 'all' | 'upcoming' | 'past'
  const [ovPage,     setOvPage]     = useState(1);
  const OV_PAGE_SIZE = 8;

  // Reset page when filters change
  useEffect(() => { setOvPage(1); }, [search, filterType, filterTime]);

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const scrollTo = minToPx(today.getHours() * 60 + today.getMinutes()) - 180;
      gridRef.current.scrollTop = Math.max(0, scrollTo);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!eng) return null;

  const events    = eng.calendarEvents || [];
  const operators = (eng.operators || []).map(id => getUserById(id)).filter(Boolean);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd  = weekDays[6];
  const todayStr = toDateStr(today);

  const eventsFor = (dateStr) => events.filter(e => e.date === dateStr);

  // Week label  e.g. "24 – 30 March 2026"
  const weekLabel = (() => {
    const s = weekDays[0], e = weekDays[6];
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  })();

  // Navigation
  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday  = () => setWeekStart(getWeekStart(today));

  // Open add modal — optionally pre-fill time from clicked slot
  const openAdd = (dateStr, startTime = '') => {
    setForm({ ...BLANK_FORM, startTime, operatorId: operators[0]?.id || '' });
    setAddModal({ date: dateStr, startTime });
  };

  // Save
  const saveEvent = () => {
    if (!form.title.trim()) return;
    const ev = {
      id:                Date.now().toString(),
      type:              form.type,
      title:             form.title.trim(),
      date:              addModal.date,
      startTime:         form.startTime,
      endTime:           form.endTime,
      operatorId:        form.operatorId,
      createdBy:         currentUser?.id || currentUser?._id || '',
      createdByCallsign: currentUser?.callsign || '',
      createdAt:         new Date().toISOString(),
    };
    updateEngagement(eng.id, { calendarEvents: [...events, ev] });
    setAddModal(null);
  };

  // Delete
  const deleteEvent = (evId) => {
    updateEngagement(eng.id, {
      calendarEvents: events.filter(e => (e.id || String(e._id)) !== evId),
    });
    setDetail(null);
  };

  // Current time position (for today's red line)
  const nowPx = minToPx(today.getHours() * 60 + today.getMinutes());

  // ── Overview helpers ──────────────────────────────────────────────────────────
  const isEventPast = (ev) => {
    if (ev.date > todayStr) return false;
    if (ev.date < todayStr) return true;
    if (!ev.startTime) return false;
    const nowTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
    return ev.startTime <= nowTime;
  };

  const overviewEvents = [...events]
    .filter(ev => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (filterTime === 'upcoming' && isEventPast(ev)) return false;
      if (filterTime === 'past'     && !isEventPast(ev)) return false;
      if (search.trim()) return ev.title.toLowerCase().includes(search.trim().toLowerCase());
      return true;
    })
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return filterTime === 'past' ? -d : d;
      const t = (a.startTime || '').localeCompare(b.startTime || '');
      return filterTime === 'past' ? -t : t;
    });

  const ovTotal = overviewEvents.length;
  const ovPages = Math.max(1, Math.ceil(ovTotal / OV_PAGE_SIZE));
  const ovSlice = overviewEvents.slice((ovPage - 1) * OV_PAGE_SIZE, ovPage * OV_PAGE_SIZE);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box pb={10}>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading fontSize="2xl" fontWeight="bold" color="var(--dash-text-primary)">
            Calendar <Text as="span" color="red.400">Planner</Text>
          </Heading>
          <Text fontSize="12px" color="var(--dash-text-secondary)" mt={1}>
            {eng.name} · click any time slot to add a task or blocker
          </Text>
        </Box>

        <Flex gap={2} align="center">
          <Button size="sm" variant="ghost" fontSize="12px" borderRadius="8px"
            color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
            onClick={goToday}>
            Today
          </Button>

          <Flex align="center" gap={1} bg="var(--dash-card-bg)"
            border="1px solid var(--dash-card-border)" borderRadius="10px" px={2} py={1}>
            <IconButton icon={<ChevronLeftIcon />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" _hover={{ color: 'white' }}
              onClick={prevWeek} aria-label="prev week" />
            <Text fontSize="12px" fontWeight="semibold" color="var(--dash-text-primary)"
              minW="190px" textAlign="center">
              {weekLabel}
            </Text>
            <IconButton icon={<ChevronRightIcon />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" _hover={{ color: 'white' }}
              onClick={nextWeek} aria-label="next week" />
          </Flex>

          <Button size="sm" leftIcon={<AddIcon boxSize={2.5} />} fontSize="12px" borderRadius="8px"
            bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.3)"
            color="rgba(255,130,130,0.9)" _hover={{ bg: 'rgba(255,80,95,0.18)' }}
            onClick={() => openAdd(todayStr)}>
            Add Event
          </Button>
        </Flex>
      </Flex>

      {/* Calendar */}
      <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
        borderRadius="16px" overflow="hidden">

        {/* Day header row */}
        <Flex borderBottom="1px solid var(--dash-card-border)">
          {/* Gutter */}
          <Box w="52px" flexShrink={0} />
          {weekDays.map((d, i) => {
            const ds      = toDateStr(d);
            const isToday = ds === todayStr;
            return (
              <Box key={ds} flex="1" py={2} textAlign="center"
                borderLeft="1px solid rgba(255,255,255,0.05)"
                bg={isToday ? 'rgba(255,80,95,0.04)' : 'transparent'}>
                <Text fontSize="9px" color="var(--dash-text-muted)" textTransform="uppercase"
                  letterSpacing="wider">{DAYS_SHORT[i]}</Text>
                <Flex align="center" justify="center" mt={0.5}>
                  <Flex w="26px" h="26px" borderRadius="7px" align="center" justify="center"
                    bg={isToday ? 'red.500' : 'transparent'}>
                    <Text fontSize="13px" fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'white' : 'var(--dash-text-secondary)'}>
                      {d.getDate()}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
        </Flex>

        {/* All-day strip — only shown if there are tasks without a time */}
        {weekDays.some(d => eventsFor(toDateStr(d)).some(e => !e.startTime)) && (
          <Flex borderBottom="1px solid rgba(255,255,255,0.05)" minH="28px" align="stretch">
            <Flex w="52px" flexShrink={0} align="center" justify="flex-end" pr={2}>
              <Text fontSize="8px" color="var(--dash-text-muted)" textTransform="uppercase"
                letterSpacing="wider">All day</Text>
            </Flex>
            {weekDays.map(d => {
              const ds        = toDateStr(d);
              const allDayEvs = eventsFor(ds).filter(e => !e.startTime);
              return (
                <Flex key={ds} flex="1" direction="column" gap="2px" py={1} px={1}
                  borderLeft="1px solid rgba(255,255,255,0.05)">
                  {allDayEvs.map(ev => {
                    const c   = EC[ev.type] || EC.task;
                    const eid = ev.id || String(ev._id);
                    return (
                      <Box key={eid} px={1.5} py="1px" borderRadius="4px"
                        bg={c.bg} border={`1px solid ${c.border}`}
                        cursor="pointer" _hover={{ opacity: 0.75 }}
                        onClick={() => setDetail(ev)}>
                        <Text fontSize="9px" color={c.text} fontWeight="semibold" noOfLines={1}>
                          {ev.title}
                        </Text>
                      </Box>
                    );
                  })}
                </Flex>
              );
            })}
          </Flex>
        )}

        {/* 24-hour scrollable grid */}
        <Box
          ref={gridRef}
          h="560px" overflowY="auto"
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '4px' },
          }}
        >
          <Flex pos="relative">

            {/* Hour labels */}
            <Box w="52px" flexShrink={0}>
              {HOURS.map(h => (
                <Box key={h} h={`${HOUR_H}px`}
                  borderBottom="1px solid rgba(255,255,255,0.04)"
                  display="flex" alignItems="flex-start" justifyContent="flex-end"
                  pr={2} pt="3px">
                  {h > 0 && (
                    <Text fontSize="9px" color="rgba(255,255,255,0.2)" userSelect="none" fontFamily="mono">
                      {pad(h)}:00
                    </Text>
                  )}
                </Box>
              ))}
            </Box>

            {/* Day columns */}
            {weekDays.map((d, colIdx) => {
              const ds        = toDateStr(d);
              const isToday   = ds === todayStr;
              const timedEvts = eventsFor(ds).filter(e => e.startTime);

              return (
                <Box key={ds} flex="1" pos="relative"
                  borderLeft="1px solid rgba(255,255,255,0.05)"
                  bg={isToday ? 'rgba(255,80,95,0.015)' : 'transparent'}>

                  {/* Hour cells (clickable) */}
                  {HOURS.map(h => (
                    <Box key={h} h={`${HOUR_H}px`}
                      borderBottom="1px solid rgba(255,255,255,0.04)"
                      cursor="pointer" transition="background 0.1s"
                      _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                      onClick={() => openAdd(ds, `${pad(h)}:00`)}
                    />
                  ))}

                  {/* Current time indicator */}
                  {isToday && (
                    <Box pos="absolute" left="0" right="0" top={`${nowPx}px`}
                      zIndex={4} pointerEvents="none">
                      <Box h="2px" bg="rgba(255,80,95,0.85)" pos="relative">
                        <Box pos="absolute" left="-5px" top="-5px"
                          w="10px" h="10px" borderRadius="full"
                          bg="rgba(255,80,95,0.9)" />
                      </Box>
                    </Box>
                  )}

                  {/* Timed events */}
                  {timedEvts.map(ev => {
                    const c        = EC[ev.type] || EC.task;
                    const startMin = timeToMin(ev.startTime);
                    const endMin   = ev.endTime ? timeToMin(ev.endTime) : startMin + 60;
                    const top      = minToPx(startMin);
                    const height   = Math.max(22, minToPx(endMin - startMin));
                    const eid      = ev.id || String(ev._id);
                    const op       = ev.operatorId ? getUserById(ev.operatorId) : null;

                    return (
                      <Box key={eid}
                        pos="absolute" left="2px" right="2px"
                        top={`${top}px`} h={`${height}px`}
                        zIndex={2} borderRadius="6px" px={1.5} py="3px"
                        bg={c.bg} border={`1px solid ${c.border}`}
                        borderLeft={`3px solid ${c.solid}`}
                        cursor="pointer" overflow="hidden"
                        transition="opacity 0.15s, transform 0.12s"
                        _hover={{ opacity: 0.85, transform: 'scaleX(0.98)' }}
                        onClick={() => setDetail(ev)}
                      >
                        <Text fontSize="10px" color={c.text} fontWeight="semibold" noOfLines={1}>
                          {ev.title}
                        </Text>
                        {height > 30 && (
                          <Text fontSize="8px" color={c.text} opacity={0.65}>
                            {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                          </Text>
                        )}
                        {height > 44 && op && (
                          <Text fontSize="8px" color={c.text} opacity={0.55} noOfLines={1}>
                            {op.callsign}
                          </Text>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Flex>
        </Box>
      </Box>

      {/* Legend */}
      <Flex gap={4} mt={3} justify="flex-end" align="center">
        <Text fontSize="10px" color="var(--dash-text-muted)">
          Click any time slot to add · click an event to view/delete
        </Text>
        {Object.entries(EC).map(([type, c]) => (
          <Flex key={type} align="center" gap={1.5}>
            <Box w="8px" h="8px" borderRadius="2px" bg={c.solid} opacity={0.8} />
            <Text fontSize="10px" color="var(--dash-text-muted)" textTransform="capitalize">{type}</Text>
          </Flex>
        ))}
      </Flex>

      {/* ── Calendar Overview ── */}
      <Box mt={10}>

        {/* Overview header + controls */}
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
          <Flex align="center" gap={3}>
            <Heading fontSize="xl" fontWeight="bold" color="var(--dash-text-primary)">
              Calendar <Text as="span" color="red.400">Overview</Text>
            </Heading>
            <Box px={2.5} py="2px" borderRadius="full"
              bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)">
              <Text fontSize="10px" fontWeight="bold" color="rgba(255,130,130,0.9)">
                {ovTotal} event{ovTotal !== 1 ? 's' : ''}
              </Text>
            </Box>
          </Flex>

          <Flex gap={2} align="center" flexWrap="wrap">
            {/* Search */}
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events…"
              {...inputStyles}
              w="190px" h="34px" fontSize="12px"
            />

            {/* Type filter */}
            <Flex bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="9px" p="3px" gap="2px">
              {['all', 'task', 'blocker'].map(f => (
                <Box key={f} as="button" px={2.5} py="5px" borderRadius="7px" fontSize="11px"
                  fontWeight="semibold" transition="all 0.15s" cursor="pointer"
                  bg={filterType === f ? 'rgba(255,255,255,0.08)' : 'transparent'}
                  color={filterType === f ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)'}
                  onClick={() => setFilterType(f)}>
                  {f === 'all' ? 'All' : f === 'task' ? '✓ Tasks' : '⚠ Blockers'}
                </Box>
              ))}
            </Flex>

            {/* Time filter */}
            <Flex bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
              borderRadius="9px" p="3px" gap="2px">
              {['all', 'upcoming', 'past'].map(f => (
                <Box key={f} as="button" px={2.5} py="5px" borderRadius="7px" fontSize="11px"
                  fontWeight="semibold" transition="all 0.15s" cursor="pointer"
                  bg={filterTime === f ? 'rgba(255,255,255,0.08)' : 'transparent'}
                  color={filterTime === f ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)'}
                  onClick={() => setFilterTime(f)}>
                  {f === 'all' ? 'All Time' : f === 'upcoming' ? 'Upcoming' : 'History'}
                </Box>
              ))}
            </Flex>
          </Flex>
        </Flex>

        {/* Event list */}
        {ovSlice.length === 0 ? (
          <Flex align="center" justify="center" py={12} direction="column" gap={2}
            bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="16px">
            <Text fontSize="28px">📭</Text>
            <Text fontSize="13px" color="var(--dash-text-muted)">
              {search.trim() ? `No events matching "${search}"` : 'No events yet'}
            </Text>
            <Text fontSize="11px" color="var(--dash-text-muted)" opacity={0.6}>
              Click any time slot on the calendar to add one
            </Text>
          </Flex>
        ) : (
          <Box bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
            borderRadius="16px" overflow="hidden">

            {/* Column headers */}
            <Flex px={4} py={2} borderBottom="1px solid rgba(255,255,255,0.05)"
              bg="rgba(255,255,255,0.02)">
              <Box w="66px" flexShrink={0} />
              <Text flex="1" fontSize="9px" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Title / Date</Text>
              <Text w="100px" flexShrink={0} fontSize="9px" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Operator</Text>
              <Text w="100px" flexShrink={0} fontSize="9px" color="var(--dash-text-muted)"
                textTransform="uppercase" letterSpacing="wider">Created by</Text>
              <Box w="70px" flexShrink={0} />
            </Flex>

            {ovSlice.map((ev, idx) => {
              const c      = EC[ev.type] || EC.task;
              const op     = ev.operatorId ? getUserById(ev.operatorId) : null;
              const isPast = isEventPast(ev);
              const eid    = ev.id || String(ev._id);
              const isLast = idx === ovSlice.length - 1;
              return (
                <Flex key={eid} align="center" gap={3} px={4} py={3}
                  borderBottom={isLast ? 'none' : '1px solid rgba(255,255,255,0.04)'}
                  cursor="pointer" transition="background 0.12s"
                  _hover={{ bg: 'rgba(255,255,255,0.025)' }}
                  onClick={() => setDetail(ev)}
                  opacity={isPast ? 0.72 : 1}>

                  {/* Type pill */}
                  <Box flexShrink={0} w="66px" textAlign="center" px={2} py="3px"
                    borderRadius="5px" fontSize="9px" fontWeight="bold"
                    letterSpacing="wider" textTransform="uppercase" whiteSpace="nowrap"
                    bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
                    {ev.type}
                  </Box>

                  {/* Title + date/time */}
                  <Box flex="1" minW={0}>
                    <Text fontSize="13px" fontWeight="semibold"
                      color="var(--dash-text-primary)" noOfLines={1}>
                      {ev.title}
                    </Text>
                    <Flex align="center" gap={1} mt="2px">
                      <Text fontSize="10px" color="var(--dash-text-muted)">
                        {fmtDate(ev.date)}
                      </Text>
                      {ev.startTime ? (
                        <Text fontSize="10px" color={c.text} fontWeight="semibold">
                          · {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                        </Text>
                      ) : (
                        <Text fontSize="10px" color="var(--dash-text-muted)" fontStyle="italic">
                          · All day
                        </Text>
                      )}
                    </Flex>
                  </Box>

                  {/* Operator */}
                  <Flex w="100px" flexShrink={0} align="center" gap={1.5}>
                    {op ? (
                      <>
                        <Flex w="20px" h="20px" borderRadius="5px" align="center" justify="center"
                          flexShrink={0}
                          bg="rgba(79,209,197,0.12)" border="1px solid rgba(79,209,197,0.25)"
                          fontSize="8px" fontWeight="bold" color="#4fd1c5" fontFamily="mono">
                          {op.callsign.slice(0, 2).toUpperCase()}
                        </Flex>
                        <Text fontSize="11px" color="var(--dash-text-secondary)" noOfLines={1}>
                          {op.callsign}
                        </Text>
                      </>
                    ) : (
                      <Text fontSize="10px" color="rgba(255,255,255,0.18)" fontStyle="italic">—</Text>
                    )}
                  </Flex>

                  {/* Created by */}
                  <Flex w="100px" flexShrink={0} align="center" gap={1.5}>
                    {ev.createdByCallsign ? (
                      <>
                        <Flex w="18px" h="18px" borderRadius="5px" align="center" justify="center"
                          flexShrink={0}
                          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
                          fontSize="8px" fontWeight="bold" color="rgba(255,130,130,0.9)" fontFamily="mono">
                          {ev.createdByCallsign.slice(0, 2).toUpperCase()}
                        </Flex>
                        <Text fontSize="11px" color="var(--dash-text-muted)" noOfLines={1}>
                          {ev.createdByCallsign}
                        </Text>
                      </>
                    ) : (
                      <Text fontSize="10px" color="rgba(255,255,255,0.18)" fontStyle="italic">—</Text>
                    )}
                  </Flex>

                  {/* Past / Upcoming badge */}
                  <Box w="70px" flexShrink={0} textAlign="center"
                    px={2} py="3px" borderRadius="20px" fontSize="9px" fontWeight="semibold"
                    letterSpacing="wide"
                    bg={isPast ? 'rgba(156,163,175,0.08)' : 'rgba(110,231,183,0.08)'}
                    border={isPast ? '1px solid rgba(156,163,175,0.18)' : '1px solid rgba(110,231,183,0.2)'}
                    color={isPast ? 'rgba(156,163,175,0.65)' : '#6ee7b7'}>
                    {isPast ? 'Past' : 'Upcoming'}
                  </Box>
                </Flex>
              );
            })}
          </Box>
        )}

        {/* Pagination */}
        {ovPages > 1 && (
          <Flex justify="center" align="center" gap={1} mt={4}>
            <IconButton icon={<ChevronLeftIcon />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" _hover={{ color: 'white' }}
              isDisabled={ovPage === 1} onClick={() => setOvPage(p => p - 1)} aria-label="prev" />

            {Array.from({ length: Math.min(5, ovPages) }, (_, i) => {
              const start = Math.max(1, Math.min(ovPage - 2, ovPages - 4));
              const pg = start + i;
              if (pg > ovPages) return null;
              return (
                <Box key={pg} as="button" w="28px" h="28px" borderRadius="7px"
                  fontSize="11px" fontWeight="semibold" transition="all 0.15s"
                  bg={ovPage === pg ? 'rgba(255,80,95,0.15)' : 'transparent'}
                  border={ovPage === pg ? '1px solid rgba(255,80,95,0.35)' : '1px solid transparent'}
                  color={ovPage === pg ? 'rgba(255,130,130,0.9)' : 'var(--dash-text-muted)'}
                  cursor="pointer" _hover={{ color: 'white', bg: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setOvPage(pg)}>
                  {pg}
                </Box>
              );
            })}

            <IconButton icon={<ChevronRightIcon />} size="xs" variant="ghost"
              color="var(--dash-text-muted)" _hover={{ color: 'white' }}
              isDisabled={ovPage === ovPages} onClick={() => setOvPage(p => p + 1)} aria-label="next" />

            <Text fontSize="10px" color="var(--dash-text-muted)" ml={2}>
              {(ovPage - 1) * OV_PAGE_SIZE + 1}–{Math.min(ovPage * OV_PAGE_SIZE, ovTotal)} of {ovTotal}
            </Text>
          </Flex>
        )}
      </Box>

      {/* ── Add Event Modal ── */}
      <Modal isOpen={!!addModal} onClose={() => setAddModal(null)} isCentered size="md">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" overflow="hidden" p={0}>
          <ModalBody p={0}>
            {addModal && (
              <Box p={6} pos="relative">
                <Box pos="absolute" top="0" left="0" right="0" h="2px"
                  style={{ background: form.type === 'blocker'
                    ? 'linear-gradient(to right, transparent, rgba(245,158,11,0.7), transparent)'
                    : 'linear-gradient(to right, transparent, rgba(99,102,241,0.7), transparent)'
                  }} />

                {/* Header */}
                <Flex justify="space-between" align="flex-start" mb={5}>
                  <Box>
                    <Text fontSize="14px" fontWeight="bold" color="var(--dash-text-primary)">
                      New Event
                    </Text>
                    <Text fontSize="11px" color="var(--dash-text-muted)" mt="2px">
                      {fmtDate(addModal.date)}
                      {addModal.startTime && (
                        <Text as="span" ml={1.5} color={EC[form.type].text}>
                          · {addModal.startTime}
                        </Text>
                      )}
                    </Text>
                  </Box>
                  <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                    color="var(--dash-text-muted)" borderRadius="8px"
                    _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                    onClick={() => setAddModal(null)} aria-label="Close" />
                </Flex>

                {/* Type toggle */}
                <Flex gap={2} mb={4}>
                  {['task', 'blocker'].map(type => {
                    const c      = EC[type];
                    const active = form.type === type;
                    return (
                      <Box key={type} as="button" flex="1" py={2.5} borderRadius="9px"
                        fontSize="12px" fontWeight="semibold" textTransform="capitalize"
                        bg={active ? c.bg : 'rgba(255,255,255,0.03)'}
                        border={`1px solid ${active ? c.border : 'rgba(255,255,255,0.08)'}`}
                        color={active ? c.text : 'var(--dash-text-muted)'}
                        transition="all 0.15s" cursor="pointer"
                        _hover={{ borderColor: c.border, color: c.text }}
                        onClick={() => setForm(p => ({ ...p, type }))}>
                        {type === 'task' ? '✓  Task' : '⚠  Blocker'}
                      </Box>
                    );
                  })}
                </Flex>

                {/* Title */}
                <Box mb={3}>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && saveEvent()}
                    placeholder={form.type === 'task'
                      ? 'e.g. Enumerate Active Directory'
                      : 'e.g. Team standup — unavailable'}
                    {...inputStyles}
                    autoFocus
                  />
                </Box>

                {/* Time */}
                <Box mb={3}>
                  <Label>Time {form.type === 'task' ? '(optional)' : ''}</Label>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <Input type="time" value={form.startTime}
                        onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                        {...inputStyles}
                        sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }} />
                      <Text fontSize="9px" color="var(--dash-text-muted)" mt={1}>Start</Text>
                    </Box>
                    <Box>
                      <Input type="time" value={form.endTime}
                        onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                        {...inputStyles}
                        sx={{ colorScheme: 'dark', '&::-webkit-calendar-picker-indicator': { filter: 'invert(0.5)' } }} />
                      <Text fontSize="9px" color="var(--dash-text-muted)" mt={1}>End (optional)</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Operator */}
                {operators.length > 0 && (
                  <Box mb={5}>
                    <Label>Assigned Operator</Label>
                    <Select value={form.operatorId}
                      onChange={e => setForm(p => ({ ...p, operatorId: e.target.value }))}
                      {...selectStyles}>
                      <option value="">— All / No specific operator —</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.callsign}</option>
                      ))}
                    </Select>
                  </Box>
                )}

                <Flex gap={3}>
                  <Button flex="1" size="sm" variant="ghost" borderRadius="10px"
                    color="var(--dash-text-muted)" border="1px solid rgba(255,255,255,0.08)"
                    _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => setAddModal(null)}>
                    Cancel
                  </Button>
                  <Button flex="1" size="sm" borderRadius="10px" fontWeight="semibold"
                    bg={EC[form.type].bg} border={`1px solid ${EC[form.type].border}`}
                    color={EC[form.type].text} _hover={{ filter: 'brightness(1.2)' }}
                    onClick={saveEvent}>
                    Save Event
                  </Button>
                </Flex>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Event Detail Modal ── */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} isCentered size="sm">
        <ModalOverlay bg="rgba(0,0,0,0.65)" backdropFilter="blur(4px)" />
        <ModalContent bg="var(--dash-card-bg)" border="1px solid var(--dash-card-border)"
          borderRadius="16px" overflow="hidden" p={0}>
          <ModalBody p={0}>
            {detail && (() => {
              const c   = EC[detail.type] || EC.task;
              const op  = detail.operatorId ? getUserById(detail.operatorId) : null;
              const eid = detail.id || String(detail._id);
              return (
                <Box p={6} pos="relative">
                  <Box pos="absolute" top="0" left="0" right="0" h="2px"
                    style={{ background: `linear-gradient(to right, transparent, ${c.solid}bb, transparent)` }} />

                  <Flex justify="space-between" align="center" mb={4}>
                    <Box px={2} py="2px" borderRadius="5px" fontSize="10px" fontWeight="bold"
                      letterSpacing="wider" textTransform="uppercase"
                      bg={c.bg} border={`1px solid ${c.border}`} color={c.text}>
                      {detail.type}
                    </Box>
                    <Flex gap={1}>
                      <IconButton icon={<DeleteIcon boxSize={3} />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" borderRadius="7px"
                        _hover={{ color: 'red.400', bg: 'rgba(255,80,95,0.1)' }}
                        onClick={() => deleteEvent(eid)} aria-label="Delete" />
                      <IconButton icon={<CloseIcon boxSize={2.5} />} size="xs" variant="ghost"
                        color="var(--dash-text-muted)" borderRadius="7px"
                        _hover={{ color: 'white', bg: 'rgba(255,255,255,0.06)' }}
                        onClick={() => setDetail(null)} aria-label="Close" />
                    </Flex>
                  </Flex>

                  <Text fontSize="16px" fontWeight="bold" color="var(--dash-text-primary)" mb={1}>
                    {detail.title}
                  </Text>
                  <Text fontSize="11px" color="var(--dash-text-muted)" mb={op ? 4 : 0}>
                    {fmtDate(detail.date)}
                    {detail.startTime && (
                      <Text as="span" ml={2} fontWeight="semibold" color={c.text}>
                        · {detail.startTime}{detail.endTime ? ` – ${detail.endTime}` : ''}
                      </Text>
                    )}
                  </Text>

                  {op && (
                    <Flex align="center" gap={2} px={3} py={2.5} borderRadius="9px" mt={3}
                      bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.07)">
                      <Flex w="26px" h="26px" borderRadius="7px" align="center" justify="center"
                        bg="rgba(79,209,197,0.12)" border="1px solid rgba(79,209,197,0.25)"
                        fontSize="10px" fontWeight="bold" color="#4fd1c5" fontFamily="mono">
                        {op.callsign.slice(0, 2).toUpperCase()}
                      </Flex>
                      <Box>
                        <Text fontSize="12px" color="var(--dash-text-secondary)" fontWeight="semibold">
                          {op.callsign}
                        </Text>
                        <Text fontSize="9px" color="var(--dash-text-muted)">Assigned operator</Text>
                      </Box>
                    </Flex>
                  )}

                  {detail.createdByCallsign && (
                    <Flex align="center" gap={2} px={3} py={2} borderRadius="9px" mt={2}
                      bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.05)">
                      <Flex w="22px" h="22px" borderRadius="6px" align="center" justify="center"
                        bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
                        fontSize="9px" fontWeight="bold" color="rgba(255,130,130,0.9)" fontFamily="mono">
                        {detail.createdByCallsign.slice(0, 2).toUpperCase()}
                      </Flex>
                      <Box>
                        <Text fontSize="11px" color="var(--dash-text-secondary)" fontWeight="semibold">
                          {detail.createdByCallsign}
                        </Text>
                        <Text fontSize="9px" color="var(--dash-text-muted)">Created by</Text>
                      </Box>
                    </Flex>
                  )}
                </Box>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default CalendarView;
