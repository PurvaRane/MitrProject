import TeamMember from '../models/TeamMember.js';
import { resolveImage } from '../config/cloudinary.js';

// First-run content from the approved I-Care We-Care poster. It is inserted
// only into an entirely empty collection and remains fully admin-manageable.
const INITIAL_TEAM = [
  { name: 'Yash', phone: '8999893770', email: 'yashmore2428@gmail.com', displayOrder: 0 },
  { name: 'Sakshi', phone: '9403371329', email: 'sakshib.200512@gmail.com', displayOrder: 1 },
  { name: 'Purva', phone: '8530062608', email: 'purvarane.2623@gmail.com', displayOrder: 2 },
  { name: 'Om', phone: '7350909448', email: 'omitrawellness@gmail.com', displayOrder: 3 },
  { name: 'Ritu', phone: '9011939795', email: 'ritu.kars23@gmail.com', displayOrder: 4 },
  { name: 'Ishwari', phone: '9809095666', email: 'ishwari0720@gmail.com', displayOrder: 5 },
];

let initialTeamPromise;
async function ensureInitialTeam() {
  if (!initialTeamPromise) {
    initialTeamPromise = (async () => {
      if ((await TeamMember.countDocuments()) === 0) {
        await TeamMember.insertMany(INITIAL_TEAM.map(member => ({
          ...member,
          isVisible: true,
          createdBy: 'initial-content',
          updatedBy: 'initial-content',
        })));
      }
    })();
  }
  try {
    await initialTeamPromise;
  } catch (error) {
    initialTeamPromise = undefined;
    throw error;
  }
}

function actor(req) {
  return req.user?.role === 'admin' ? 'admin' : (req.user?._id?.toString() || 'admin');
}

export const getPublicTeam = async (_req, res) => {
  await ensureInitialTeam();
  const members = await TeamMember.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: 1 });
  res.status(200).json({ success: true, members });
};

export const getAdminTeam = async (_req, res) => {
  await ensureInitialTeam();
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
