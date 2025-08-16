import express from 'express'
import multer from 'multer'
import axios from 'axios'

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Convert PDF -> DOCX using OnlyOffice DocumentServer
// Requires DocumentServer running, e.g.: docker run -d -p 8080:80 onlyoffice/documentserver
const OO_URL = process.env.OO_URL || 'http://localhost:8080'

app.post('/api/convert/pdf-to-docx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' })
    const base64 = req.file.buffer.toString('base64')
    const title = (req.file.originalname || 'file').replace(/\.pdf$/i, '') + '.docx'

    const { data } = await axios.post(
      `${OO_URL}/ConvertService.ashx`,
      {
        async: false,
        filetype: 'pdf',
        outputtype: 'docx',
        title,
        key: Date.now().toString(),
        base64
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 180000 }
    )

    if (!data?.endConvert || !data?.fileUrl) {
      return res.status(502).json({ error: 'conversion not finished', details: data })
    }

    const docx = await axios.get(data.fileUrl, { responseType: 'arraybuffer' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${title}"`)
    res.send(Buffer.from(docx.data))
  } catch (e) {
    res.status(500).json({ error: 'convert failed', details: e?.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Converter API on :${PORT}`))


