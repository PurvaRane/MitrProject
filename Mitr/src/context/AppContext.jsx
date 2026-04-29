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

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const addEvent = useCallback(async (eventData) => {
    const data = await eventsAPI.create(eventData);
    setEvents(prev => [data.event, ...prev]);
    return data.event;
  }, []);

  const removeEvent = useCallback(async (id) => {
    await eventsAPI.delete(id);
    setEvents(prev => prev.filter(e => (e._id || e.id) !== id));
  }, []);

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
  const [activeTask, setActiveTask]             = useState(null);
  const [tasks, setTasks]                       = useState([]);
  const [activeDay, setActiveDayState]          = useState(1);
  const [challengeLoading, setChallengeLoading] = useState(false);

  const fetchActiveChallenge = useCallback(async () => {
    setChallengeLoading(true);
    try {
      const data = await challengeAPI.getActive();
      setActiveTask(data.challenge);
      setActiveDayState(data.challenge.day);
    } catch {
      setActiveTask(null);
    } finally {
      setChallengeLoading(false);
    }
  }, []);

  const fetchAllChallenges = useCallback(async () => {
    try {
      const data = await challengeAPI.getAll();
      setTasks(data.challenges || []);
    } catch {
      setTasks([]);
    }
  }, []);

  useEffect(() => { fetchActiveChallenge(); }, [fetchActiveChallenge]);

  const setActiveDay = useCallback(async (day) => {
    await challengeAPI.activateDay(day);
    setActiveDayState(day);
    await fetchActiveChallenge();
  }, [fetchActiveChallenge]);

  // ── Per-user challenge progress ───────────────────────────────────────────
  const [challengeProgress, setChallengeProgress] = useState({
    done: {}, reflections: {}, streak: 0, doneCount: 0,
  });
  const [progressLoading, setProgressLoading] = useState(false);

  const syncUserProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      const data = await userAPI.getProgress();
      const done = {};
      const reflections = {};
      (data.submissions || []).forEach(s => {
        if (s.isDone) done[s.challengeDay] = true;
        if (s.reflectionText) reflections[s.challengeDay] = s.reflectionText;
      });
      const progress = {
        done, reflections,
        streak: data.streak || 0,
        doneCount: data.doneCount || Object.keys(done).length,
      };
      setChallengeProgress(progress);
      saveJSON('mitr_challenge_progress', progress);
    } catch (err) {
      console.error('[Progress] Sync failed:', err.message);
      const cached = loadJSON('mitr_challenge_progress', { done: {}, reflections: {}, streak: 0, doneCount: 0 });
      setChallengeProgress(cached);
    } finally {
      setProgressLoading(false);
    }
  }, []);

  useEffect(() => { syncUserProgress(); }, [syncUserProgress]);

  const markDone = useCallback(async (day) => {
    try {
      await submissionsAPI.submit({
        challengeDay: day,
        isDone: true,
        reflectionText: challengeProgress.reflections[day] || '',
      });
      // Refresh progress to get accurate streak/count from server
      await syncUserProgress();
    } catch (err) {
      console.error('[markDone] Backend save failed:', err.message);
      // Fallback local update
      setChallengeProgress(prev => {
        const done = { ...prev.done, [day]: true };
        let streak = 0;
        for (let d = 1; d <= 30; d++) { if (done[d]) streak++; else break; }
        const next = { ...prev, done, streak, doneCount: Object.keys(done).length };
        saveJSON('mitr_challenge_progress', next);
        return next;
      });
    }
  }, [challengeProgress, syncUserProgress]);

  const saveReflection = useCallback(async (day, text, imageUrl) => {
    try {
      await submissionsAPI.submit({
        challengeDay: day,
        reflectionText: text,
        isDone: !!challengeProgress.done[day],
        imageUrl,
      });
      // Refresh progress to get updated reflection state
      await syncUserProgress();
    } catch (err) {
      console.error('[saveReflection] Backend save failed:', err.message);
      // Fallback local update
      setChallengeProgress(prev => {
        const next = { ...prev, reflections: { ...prev.reflections, [day]: text } };
        saveJSON('mitr_challenge_progress', next);
        return next;
      });
    }
  }, [challengeProgress, syncUserProgress]);

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
      // Wellness Info
      wellnessInfo, wellnessLoading, fetchWellnessInfo, saveWellnessInfo,
      // Event Reports
      eventReports, reportsLoading, fetchEventReports, addEventReport, removeEventReport,
      // Challenge
      tasks, activeDay, setActiveDay, activeTask,
      challengeLoading, fetchAllChallenges,
      // Per-user progress
      challengeProgress, progressLoading,
      markDone, saveReflection, syncUserProgress,
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
