// Mise à jour d'un admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    if (update.password) {
      const bcrypt = require('bcryptjs');
      update.password = await bcrypt.hash(update.password, 10);
    }
    const admin = await Admin.findByIdAndUpdate(id, update, { new: true });
    if (!admin) return res.status(404).json({ message: 'Admin non trouvé' });
    res.json({ message: 'Admin modifié', admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    next(err);
  }
};

// Suppression d'un admin
exports.deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: 'Admin non trouvé' });
    res.json({ message: 'Admin supprimé' });
  } catch (err) {
    next(err);
  }
};
// Contrôleur Admin

// Liste paginée et recherche admins (par nom ou email)

const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

exports.getAllAdmins = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};
    const count = await Admin.countDocuments(query);
    const docs = await Admin.find(query)
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

// Création d'un admin
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    if (role && !['superadmin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Rôle admin invalide' });
    }
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email,
      password: hash,
      role: role || 'manager',
      permissions
    });
    res.status(201).json({ message: 'Admin créé', admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    next(err);
  }
};

// Connexion admin
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Email ou mot de passe invalide' });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe invalide' });
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin._id, role: admin.role, type: 'admin' },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '7d' }
    );
    res.json({ token, admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    next(err);
  }
};
