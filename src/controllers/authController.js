const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, whatsapp_number, location, contacts_count } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, phone, password: hash, role, whatsapp_number, location, contacts_count
    });
    // Générer un token JWT comme pour le login
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: { ...user.toObject(), password: undefined }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Permettre login par email OU whatsapp_number
    const user = await User.findOne({
      $or: [
        { email },
        { whatsapp_number: email }
      ]
    });
    if (!user) return res.status(400).json({ message: 'Utilisateur introuvable' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    next(err);
  }
};
