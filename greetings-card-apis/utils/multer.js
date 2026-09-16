const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Only media that the product actually needs is accepted, and files are
// renamed to random names so a client can never choose what path is served.
const IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
};
const VIDEO_TYPES = {
    'video/mp4': ['.mp4', '.m4v'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
};
const AUDIO_TYPES = {
    'audio/mpeg': ['.mp3'],
    'audio/mp3': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/x-wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/mp4': ['.m4a'],
    'audio/x-m4a': ['.m4a'],
};

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

const makeFilter = (allowed) => (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okExts = allowed[file.mimetype];
    if (!okExts || !okExts.includes(ext)) {
        const err = new Error(`Unsupported file type: ${file.mimetype || 'unknown'} (${ext || 'no extension'})`);
        err.status = 415;
        return cb(err);
    }
    cb(null, true);
};

const randomName = (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
};

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    return dir;
};

// Generic uploader for card/template media (images and videos).
const uploadMiddleware = (modelName) => {
    const destination = ensureDir(`./public/uploads/images/${modelName}/`);
    return multer({
        storage: multer.diskStorage({destination, filename: randomName}),
        fileFilter: makeFilter({...IMAGE_TYPES, ...VIDEO_TYPES}),
        limits: {fileSize: MAX_VIDEO_BYTES, files: 10},
    });
};

// Images only (card faces, screenshots, marketing images).
const uploadImageMiddleware = (modelName) => {
    const destination = ensureDir(`./public/uploads/images/${modelName}/`);
    return multer({
        storage: multer.diskStorage({destination, filename: randomName}),
        fileFilter: makeFilter(IMAGE_TYPES),
        limits: {fileSize: MAX_IMAGE_BYTES, files: 10},
    });
};

const getBase64 = () => multer({
    storage: multer.memoryStorage(),
    fileFilter: makeFilter(IMAGE_TYPES),
    limits: {fileSize: MAX_IMAGE_BYTES, files: 1},
});

const uploadMusicFile = (modelName) => {
    const destination = ensureDir(`./public/uploads/music/${modelName}/`);
    return multer({
        storage: multer.diskStorage({destination, filename: randomName}),
        fileFilter: makeFilter(AUDIO_TYPES),
        limits: {fileSize: MAX_AUDIO_BYTES, files: 1},
    });
};

module.exports = {uploadMiddleware, uploadImageMiddleware, getBase64, uploadMusicFile};
