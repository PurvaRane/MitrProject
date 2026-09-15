import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventsAPI, challengeAPI, submissionsAPI, userAPI, wellnessAPI, eventReportsAPI, journalAPI } from '../api';

export const AppContext = createContext(null);

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage full */ }
}

export function AppProvider({ children }) {
  // ── Events ────────────────────────────────────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState([]);

  const fetchEvents = useCallback(async (category) => {
    setEventsLoading(true);
    try {
      const data = await eventsAPI.getAll(category);
      setEvents(data.events || []);
    } catch (err) {
      console.error('[Events] Fetch failed:', err.message);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchMyRegistrations = useCallback(async () => {
    try {
      const data = await eventsAPI.getMyRegistrations();
      setMyRegistrations(data.registrations || []);
    } catch (err) {
      console.error('[Events] Registration fetch failed:', err.message);
    }
  }, []);

  useEffect(() => { 
    fetchEvents(); 
    fetchMyRegistrations();
  }, [fetchEvents, fetchMyRegistrations]);

  const addEvent = useCallback(async (eventData) => {
    const data = await eventsAPI.create(eventData);
    setEvents(prev => [data.event, ...prev]);
    return data.event;
  }, []);

  const removeEvent = useCallback(async (id) => {
    await eventsAPI.delete(id);
    setEvents(prev => prev.filter(e => (e._id || e.id) !== id));
  }, []);

  const registerForEvent = useCallback(async (eventId) => {
    const data = await eventsAPI.register(eventId);
    await fetchMyRegistrations();
    return data;
  }, [fetchMyRegistrations]);

  const cancelEventRegistration = useCallback(async (eventId) => {
    await eventsAPI.cancelRegistration(eventId);
    await fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  // ── Wellness Info ─────────────────────────────────────────────────────────
  const [wellnessInfo, setWellnessInfo]         = useState(null);
  const [wellnessLoading, setWellnessLoading]   = useState(false);

  const fetchWellnessInfo = useCallback(async () => {
    setWellnessLoading(true);
    try {
      const data = await wellnessAPI.get();
      setWellnessInfo(data.info || null);
    } catch (err) {
      console.error('[Wellness] Fetch failed:', err.message);
    } finally {
      setWellnessLoading(false);
    }
  }, []);

  useEffect(() => { fetchWellnessInfo(); }, [fetchWellnessInfo]);

  const saveWellnessInfo = useCallback(async (payload) => {
    const data = await wellnessAPI.upsert(payload);
    setWellnessInfo(data.info);
    return data.info;
  }, []);

  // ── Event Reports ─────────────────────────────────────────────────────────
  const [eventReports, setEventReports]             = useState([]);
  const [reportsLoading, setReportsLoading]         = useState(false);

  const fetchEventReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const data = await eventReportsAPI.getAll();
      setEventReports(data.reports || []);
    } catch (err) {
      console.error('[EventReports] Fetch failed:', err.message);
      setEventReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEventReports(); }, [fetchEventReports]);

  const addEventReport = useCallback(async (payload) => {
    const data = await eventReportsAPI.create(payload);
    setEventReports(prev => [data.report, ...prev]);
    return data.report;
  }, []);

  const removeEventReport = useCallback(async (id) => {
    await eventReportsAPI.delete(id);
    setEventReports(prev => prev.filter(r => (r._id || r.id) !== id));
  }, []);

  // ── Challenge ─────────────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [myChallenges, setMyChallenges] = useState({});

  const fetchAllChallenges = useCallback(async () => {
    setChallengeLoading(true);
    try {
      const data = await challengeAPI.getAll();
      setChallenges(data.challenges || []);
    } catch {
      setChallenges([]);
    } finally {
      setChallengeLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllChallenges(); }, [fetchAllChallenges]);

  const joinChallenge = useCallback(async (challengeId) => {
    const data = await challengeAPI.join(challengeId);
    return data;
  }, []);

  const completeTask = useCallback(async (challengeId, taskId) => {
    const data = await challengeAPI.completeTask(challengeId, taskId);
    return data;
  }, []);

  const submitTaskFeedback = useCallback(async (challengeId, taskId, payload) => {
    const data = await challengeAPI.submitFeedback(challengeId, taskId, payload);
    return data;
  }, []);

  // ── Journal ───────────────────────────────────────────────────────────────
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);

  const fetchJournalEntries = useCallback(async () => {
    setJournalLoading(true);
    try {
      const data = await journalAPI.getMy();
      setJournalEntries(data.entries || []);
    } catch (err) {
      console.error('[Journal] Fetch failed:', err.message);
      setJournalEntries([]);
    } finally {
      setJournalLoading(false);
    }
  }, []);

  useEffect(() => { fetchJournalEntries(); }, [fetchJournalEntries]);

  const addJournalEntry = useCallback(async (payload) => {
    const data = await journalAPI.create(payload);
    setJournalEntries(prev => [data.entry, ...prev]);
    return data.entry;
  }, []);

  const removeJournalEntry = useCallback(async (id) => {
    await journalAPI.delete(id);
    setJournalEntries(prev => prev.filter(e => (e._id || e.id) !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      // Events
      events, eventsLoading, fetchEvents, addEvent, removeEvent,
      myRegistrations, fetchMyRegistrations, registerForEvent, cancelEventRegistration,
      // Wellness Info
      wellnessInfo, wellnessLoading, fetchWellnessInfo, saveWellnessInfo,
      // Event Reports
      eventReports, reportsLoading, fetchEventReports, addEventReport, removeEventReport,
      // Challenge
      challenges, challengeLoading, fetchAllChallenges,
      joinChallenge, completeTask, submitTaskFeedback,
      // Journal
      journalEntries, journalLoading, fetchJournalEntries, addJournalEntry, removeJournalEntry,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
