import EventReport from '../models/EventReport.js';

// ── GET /api/event-reports ─────────────────────────────────────────────────
export const getEventReports = async (req, res) => {
  const reports = await EventReport.find().sort({ date: -1 });
  res.status(200).json({ success: true, count: reports.length, reports });
};

// ── POST /api/event-reports — Admin adds a report ─────────────────────────
export const createEventReport = async (req, res) => {
  const { title, date, summary, images, fileUrl } = req.body;

  if (!title || !date || !summary) {
    return res.status(400).json({
      success: false,
      message: 'Title, date, and summary are required.',
    });
  }

  console.log('[POST /api/event-reports] Creating report:', title);

  const report = await EventReport.create({
    title: title.trim(),
    date: new Date(date),
    summary: summary.trim(),
    images: images || [],
    fileUrl: fileUrl || null,
    createdBy: 'admin',
  });

  console.log('[POST /api/event-reports] ✅ Report created:', report._id);
  res.status(201).json({ success: true, report });
};

// ── DELETE /api/event-reports/:id ─────────────────────────────────────────
export const deleteEventReport = async (req, res) => {
  const report = await EventReport.findByIdAndDelete(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }
  console.log('[DELETE /api/event-reports] ✅ Deleted:', req.params.id);
  res.status(200).json({ success: true, message: 'Report deleted.' });
};
