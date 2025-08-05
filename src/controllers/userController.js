// Mise à jour d'un utilisateur
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    if (update.password) {
      const bcrypt = require('bcryptjs');
      update.password = await bcrypt.hash(update.password, 10);
    }
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur modifié', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    next(err);
  }
};

// Suppression d'un utilisateur
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    next(err);
  }
};
// Contrôleur User

// Liste paginée et recherche utilisateurs
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { whatsapp_number: { $regex: search, $options: 'i' } }
          ]
        }
      : {};
    const count = await require('../models/User').countDocuments(query);
    const docs = await require('../models/User')
      .find(query)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
    res.json({
      totalCount: count,
      page: Number(page),
      pageSize: docs.length,
      data: docs
    });
  } catch (err) {
    next(err);
  }
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, whatsapp_number, location, contacts_count } = req.body;
    // Validation simple
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    if (!['ambassador', 'advertiser', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, phone, password: hash, role, whatsapp_number, location, contacts_count
    });
    res.status(201).json({ message: 'Utilisateur créé', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    next(err);
  }
};
