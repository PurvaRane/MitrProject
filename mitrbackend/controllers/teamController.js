import TeamMember from '../models/TeamMember.js';
import { resolveImage } from '../config/cloudinary.js';

function actor(req) {
  return req.user?.role === 'admin' ? 'admin' : (req.user?._id?.toString() || 'admin');
}

export const getPublicTeam = async (_req, res) => {
  const members = await TeamMember.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: 1 });
  res.status(200).json({ success: true, members });
};

export const getAdminTeam = async (_req, res) => {
  const members = await TeamMember.find().sort({ displayOrder: 1, createdAt: 1 });
  res.status(200).json({ success: true, members });
};

export const createTeamMember = async (req, res) => {
  const { name, phone, email, imageUrl, displayOrder, isVisible } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }

  let resolvedImage = null;
  if (imageUrl) {
    try {
      resolvedImage = await resolveImage(imageUrl, 'mitr/team');
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  }

  const count = await TeamMember.countDocuments();
  const member = await TeamMember.create({
    name: name.trim(),
    phone: (phone || '').trim(),
    email: (email || '').trim().toLowerCase(),
    imageUrl: resolvedImage,
    displayOrder: displayOrder ?? count,
    isVisible: isVisible !== false,
    createdBy: actor(req),
    updatedBy: actor(req),
  });

  res.status(201).json({ success: true, member });
};

export const updateTeamMember = async (req, res) => {
  const member = await TeamMember.findById(req.params.id);
  if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });

  const { name, phone, email, imageUrl, displayOrder, isVisible } = req.body;
  if (name !== undefined) member.name = name.trim();
  if (phone !== undefined) member.phone = phone.trim();
  if (email !== undefined) member.email = email.trim().toLowerCase();
  if (displayOrder !== undefined) member.displayOrder = displayOrder;
  if (isVisible !== undefined) member.isVisible = !!isVisible;

  if (imageUrl) {
    try {
      member.imageUrl = await resolveImage(imageUrl, 'mitr/team');
    } catch (err) {
      return res.status(err.status || 400).json({ success: false, message: err.message });
    }
  }

  member.updatedBy = actor(req);
  await member.save();
  res.status(200).json({ success: true, member });
};

export const reorderTeam = async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ success: false, message: 'Order array is required.' });
  }
  await Promise.all(
    order.map((id, index) => TeamMember.findByIdAndUpdate(id, { displayOrder: index, updatedBy: actor(req) }))
  );
  const members = await TeamMember.find().sort({ displayOrder: 1, createdAt: 1 });
  res.status(200).json({ success: true, members });
};

export const deleteTeamMember = async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });
  res.status(200).json({ success: true, message: 'Team member removed.' });
};
