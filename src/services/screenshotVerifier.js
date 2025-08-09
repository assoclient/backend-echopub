const sharp = require('sharp');
const imageHash = require('image-hash');
const exifParser = require('exif-parser');
const Tesseract = require('tesseract.js');
const ssim = require('ssim.js');
const fs = require('fs');
const path = require('path');

// Compare la capture à l'image officielle de la campagne
async function compareSimilarity(screenshotPath, campaignImagePath) {
  // SSIM
  const { ssim_map, mssim } = await ssim.compare(
    fs.readFileSync(screenshotPath),
    fs.readFileSync(campaignImagePath),
    { ssim: 'fast' }
  );
  return mssim;
}

// Hash perceptuel
function getImageHash(imagePath) {
  return new Promise((resolve, reject) => {
    imageHash.hash(imagePath, 8, 'hex', (err, hash) => {
      if (err) reject(err);
      else resolve(hash);
    });
  });
}

// Analyse EXIF
function getExif(imagePath) {
  try {
    const buffer = fs.readFileSync(imagePath);
    const parser = exifParser.create(buffer);
    return parser.parse();
  } catch (e) {
    return null;
  }
}

// OCR et analyse contextuelle
async function analyzeScreenshotText(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng+fra');
  return text;
}


// Vérification complète (sans comparaison visuelle pour supporter les vidéos)
async function verifyScreenshot({ screenshotPath }) {
  // 1. Hash
  //const hash = await getImageHash(screenshotPath);
  // 2. EXIF
  const exif = getExif(screenshotPath);
  // 3. OCR
  const ocrText = await analyzeScreenshotText(screenshotPath);
  // 4. Checklist contextuelle
  const checklist = {
    top_bar_contains: /statut|status/i.test(ocrText),
    bottom_has_eyes_icon: /œil|vues|views|vu par/i.test(ocrText),
    image_contains_published_time: /(il y a|min|heure)/i.test(ocrText),
    exif,
    //hash
  };
  return checklist;
}

module.exports = { verifyScreenshot };
