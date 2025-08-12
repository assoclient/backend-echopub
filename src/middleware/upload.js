const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime'];
  console.log('file.mimetype', file.mimetype);
  console.log('file.originalname', file.originalname);
  
  // Vérifier d'abord le type MIME
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  
  // Si le type MIME n'est pas reconnu, vérifier l'extension du fichier
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov'];
  
  if (allowedExtensions.includes(ext)) {
    console.log('Fichier accepté basé sur l\'extension:', ext);
    cb(null, true);
    return;
  }
  
  // Accepter aussi application/octet-stream si c'est une image basée sur l'extension
  if (file.mimetype === 'application/octet-stream' && ['.jpg', '.jpeg', '.png'].includes(ext)) {
    console.log('Fichier image accepté malgré le type MIME générique');
    cb(null, true);
    return;
  }
  
  cb(new Error(`Type de fichier non supporté: ${file.mimetype} (${ext})`), false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
