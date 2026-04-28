// routes/music.js
const express = require("express");
const fs = require("fs");
const path = require("path");

module.exports = function createMusicRouter({ dir }) {
    const router = express.Router();
    const MUSIC_DIR = dir;

    // ensure folder exists
    if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR, { recursive: true });

    // helper: return audio files in /public/music (sorted)
    // function getAudioFiles() {
    //     const exts = new Set([".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac"]);
    //     if (!fs.existsSync(MUSIC_DIR)) return [];
    //     return fs
    //         .readdirSync(MUSIC_DIR)
    //         .filter(n => exts.has(path.extname(n).toLowerCase()))
    //         .sort((a, b) => a.localeCompare(b));
    // }

    function getAudioFiles() {
        const exts = new Set([".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac"]);
        if (!fs.existsSync(MUSIC_DIR)) return [];
        return fs
            .readdirSync(MUSIC_DIR)
            .filter(n => exts.has(path.extname(n).toLowerCase()))
            .sort((a, b) => {
                const an = parseInt(a, 10);
                const bn = parseInt(b, 10);
                return an - bn;
            });
    }


    // List with indices + direct URLs
    router.get("/music", (req, res) => {
        const files = getAudioFiles();
        const list = files.map((name, index) => {
            const p = path.join(MUSIC_DIR, name);
            const { size } = fs.statSync(p);
            return {
                index,
                name,
                size,
                url: `/music/${encodeURIComponent(name)}` // served by express.static
            };
        });
        res.json(list);
    });

    // Stream by index (Range support)
    router.get("/music/:index", (req, res) => {
        const files = getAudioFiles();
        const idx = Number(req.params.index);

        if (!Number.isInteger(idx) || idx < 0 || idx >= files.length) {
            return res.status(404).json({ error: "Invalid index" });
        }

        const fileName = files[idx];
        const filePath = path.join(MUSIC_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File missing on disk" });
        }

        const stat = fs.statSync(filePath);
        const range = req.headers.range;

        const ext = path.extname(fileName).toLowerCase();
        const mime =
            ext === ".mp3" ? "audio/mpeg" :
                ext === ".m4a" ? "audio/mp4"  :
                    ext === ".wav" ? "audio/wav"  :
                        ext === ".ogg" ? "audio/ogg"  :
                            ext === ".flac"? "audio/flac" : "application/octet-stream";

        if (!range) {
            res.writeHead(200, {
                "Content-Type": mime,
                "Content-Length": stat.size,
                "Accept-Ranges": "bytes",
                "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`
            });
            return fs.createReadStream(filePath).pipe(res);
        }

        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : stat.size - 1;

        if (isNaN(start) || isNaN(end) || start > end || end >= stat.size) {
            return res.status(416).set({ "Content-Range": `bytes */${stat.size}` }).end();
        }

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Content-Type": mime,
            "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`
        });

        fs.createReadStream(filePath, { start, end }).pipe(res);
    });

    return router;
};
