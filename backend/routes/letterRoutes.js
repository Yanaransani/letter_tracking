const express = require("express");
const db = require("../config/db");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const router = express.Router();

// Create a letter
router.post("/create", async (req, res) => {
    const { title, description, current_department } = req.body;

    db.query(
        "INSERT INTO letters (title, description, current_department) VALUES (?, ?, ?)",
        [title, description, current_department],
        async (err, result) => {
            if (err) return res.status(500).send(err);

            const letterId = result.insertId;
            const qrData = `http://localhost:3000/track/${letterId}`;

            // Generate QR Code
            const qrCodePath = `public/qrcodes/${letterId}.png`;
            await QRCode.toFile(qrCodePath, qrData);

            // Generate PDF
            const pdfPath = `public/pdfs/${letterId}.pdf`;
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(pdfPath));
            doc.text(`Letter ID: ${letterId}`);
            doc.text(`Title: ${title}`);
            doc.text(`Current Department: ${current_department}`);
            doc.image(qrCodePath, { fit: [100, 100] });
            doc.end();

            db.query(
                "UPDATE letters SET qr_code = ?, pdf_file = ? WHERE id = ?",
                [qrCodePath, pdfPath, letterId]
            );

            res.json({ message: "Letter created", qrCode: qrCodePath, pdf: pdfPath });
        }
    );
});

// Track letter
router.get("/track/:id", (req, res) => {
    const { id } = req.params;

    db.query("SELECT * FROM letters WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: "Letter not found" });

        res.json(results[0]);
    });
});

//get all letters
router.get("/all", (req, res) => {
    console.log("Fetching all letters");
    db.query(
        "SELECT id, title, description, stats, current_department, qr_code, pdf_file FROM letter",
        (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.json({ letters: results });
        }
    );
});

module.exports = router;
