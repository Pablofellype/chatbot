const express = require('express');
const multer = require('multer');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `tmp_${Date.now()}.webm`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo nao permitido'), false);
    }
  },
});

const mediaStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media_${Date.now()}${ext}`);
  },
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo nao permitido. Apenas imagens e videos sao aceitos.'), false);
    }
  },
});

router.post('/audio', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });

  const inputPath = req.file.path;
  const outputName = `audio_${Date.now()}.ogg`;
  const outputPath = path.join(uploadsDir, outputName);

  try {
    // Converte para ogg/opus (formato que o WhatsApp aceita para PTT)
    execSync(`ffmpeg -i "${inputPath}" -c:a libopus -b:a 128k -vbr on -compression_level 10 -application voip -ar 48000 -ac 1 -y "${outputPath}"`, { stdio: 'ignore' });
    // Remove o arquivo temporário webm
    fs.unlinkSync(inputPath);
    console.log(`[UPLOAD] Audio convertido: ${outputName}`);
    res.json({ url: `/uploads/${outputName}`, filename: outputName });
  } catch (e) {
    console.error('[UPLOAD] Erro ao converter audio:', e.message);
    // Se ffmpeg falhar, usa o arquivo original
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  }
});

router.post('/media', uploadMedia.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });

  const url = `/uploads/${req.file.filename}`;
  console.log(`[UPLOAD] Arquivo recebido: ${req.file.filename}`);
  res.json({ url, filename: req.file.filename });
});

module.exports = router;
