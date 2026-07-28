import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI is required');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const entrySchema = new mongoose.Schema({
  date: String,
  firmName: String,
  owner: String,
  phone: String,
  designation: String,
  clientStatus: String,
  meetingPlace: String,
  location: String,
  remarks: String,
  createdAt: Number,
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  salesOfficer: String,
}, { collection: 'daily_report_settings' });

const Entry = mongoose.model('Entry', entrySchema);
const Settings = mongoose.model('Settings', settingsSchema);

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }).lean();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load entries' });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const entry = new Entry({ ...req.body, createdAt: Date.now() });
    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save entry' });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update entry' });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    const result = await Entry.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete entry' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || { salesOfficer: '' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save settings' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
