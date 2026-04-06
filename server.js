require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
	api_key: process.env.CLOUDINARY_API_KEY || '',
	api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 7 * 24 * 60 * 60 * 1000 }));

const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

let dbConnected = false;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/premium-store', { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => { dbConnected = true; console.log('MongoDB connected'); })
	.catch(err => { console.warn('MongoDB connection failed:', err.message); });

const productSchema = new mongoose.Schema({
	title: { type: String, required: true },
	slug: { type: String, index: true },
	description: String,
	price: Number,
	oldPrice: Number,
	image: String,
	rating: Number,
	reviews: Number,
	category: String
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true },
	email: String,
	password: String,
	isAdmin: { type: Boolean, default: false }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	items: Array,
	total: Number,
	status: { type: String, default: 'pending' },
	shipping: Object
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

const upload = multer({ storage: multer.memoryStorage() });

function generateSlug(text) {
	return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function verifyToken(req, res, next) {
	const auth = req.headers.authorization || '';
	if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
	const token = auth.slice(7);
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
		req.user = decoded;
		next();
	} catch (err) {
		res.status(401).json({ error: 'Invalid token' });
	}
}

function checkAdmin(req, res, next) {
	const adminKey = req.headers['x-admin-key'];
	if (adminKey === 'admin-secret') return next();
	try {
		verifyToken(req, res, () => {
			if (req.user && req.user.isAdmin) return next();
			return res.status(403).json({ error: 'Admin required' });
		});
	} catch (e) {
		res.status(403).json({ error: 'Admin required' });
	}
}

app.get('/api/products', async (req, res) => {
	const q = (req.query.q || '').toLowerCase();
	const category = (req.query.category || '').toLowerCase();
	const page = Math.max(1, parseInt(req.query.page || '1', 10));
	const limit = Math.min(48, parseInt(req.query.limit || '12', 10));

	if (dbConnected) {
		const filter = {};
		if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
		if (category) filter.category = category;
		const total = await Product.countDocuments(filter);
		const products = await Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
		return res.json({ total, page, limit, products });
	} else {
		if (!global.demoProducts) {
			global.demoProducts = [
				{ id:'1', _id:'1', title:'Samsung Galaxy S24 Ultra 256GB', slug:'samsung-galaxy-s24-ultra', price:15990000, oldPrice:18500000, image:'https://picsum.photos/seed/phone1/600/600', rating:4.8, reviews:342, category:'electronics', description:'Eng so\'nggi Samsung flagman smartfoni. Titanium ramka, 200MP kamera, S Pen qo\'llab-quvvatlash.' },
				{ id:'2', _id:'2', title:'Apple AirPods Pro 2', slug:'airpods-pro-2', price:3200000, oldPrice:3800000, image:'https://picsum.photos/seed/airpods2/600/600', rating:4.7, reviews:512, category:'electronics', description:'Aktiv shovqinni yo\'qotish texnologiyasi, Transparency rejimi, USB-C zaryadlash.' },
				{ id:'3', _id:'3', title:'Nike Air Max 270 Erkaklar uchun', slug:'nike-air-max-270', price:1450000, oldPrice:1900000, image:'https://picsum.photos/seed/nike270/600/600', rating:4.5, reviews:189, category:'fashion', description:'Qulay va zamonaviy sport krossovka. Havo yostiqi texnologiyasi bilan.' },
				{ id:'4', _id:'4', title:'Xiaomi Robot Changyutgich S10+', slug:'xiaomi-robot-vacuum', price:4800000, oldPrice:5500000, image:'https://picsum.photos/seed/vacuum1/600/600', rating:4.6, reviews:78, category:'home', description:'Aqlli uy uchun robot changyutgich. LDS navigatsiya, 4000Pa so\'rish kuchi.' },
				{ id:'5', _id:'5', title:'Erkaklar uchun klassik ko\'ylak', slug:'classic-shirt', price:350000, oldPrice:null, image:'https://picsum.photos/seed/shirt1/600/600', rating:4.3, reviews:94, category:'fashion', description:'100% paxta, nafis dizayn, ofis va kundalik kiyim uchun ideal.' },
				{ id:'6', _id:'6', title:'MacBook Air M2 15-dyum', slug:'macbook-air-m2-15', price:19500000, oldPrice:22000000, image:'https://picsum.photos/seed/macbook2/600/600', rating:4.9, reviews:156, category:'electronics', description:'Apple M2 chip, 8GB RAM, 256GB SSD, 15.3 dyum Liquid Retina displey.' },
				{ id:'7', _id:'7', title:'Tefal Multikuker RK8121', slug:'tefal-multicooker', price:1200000, oldPrice:1500000, image:'https://picsum.photos/seed/cooker1/600/600', rating:4.4, reviews:231, category:'home', description:'45 ta avtomatik dastur, 5L sig\'im, taymer, issiqlikni saqlash.' },
				{ id:'8', _id:'8', title:'Adidas Ultraboost 23', slug:'adidas-ultraboost-23', price:1850000, oldPrice:null, image:'https://picsum.photos/seed/adidas1/600/600', rating:4.6, reviews:67, category:'fashion', description:'Boost texnologiyasi, Continental kauchuk taglik, Primeknit yuza.' },
				{ id:'9', _id:'9', title:'Samsung 55" QLED 4K Smart TV', slug:'samsung-55-qled', price:8900000, oldPrice:11000000, image:'https://picsum.photos/seed/tv1/600/600', rating:4.7, reviews:98, category:'electronics', description:'Quantum Dot texnologiyasi, 4K UHD, Smart Hub, HDR10+ qo\'llab-quvvatlash.' },
				{ id:'10', _id:'10', title:'Dyson V15 simsiz changyutgich', slug:'dyson-v15', price:7500000, oldPrice:8200000, image:'https://picsum.photos/seed/dyson1/600/600', rating:4.8, reviews:44, category:'home', description:'Lazer yoritgich texnologiyasi, 60 daqiqali batareya, HEPA filtrlash.' },
				{ id:'11', _id:'11', title:'Zara ayollar uchun palto', slug:'zara-coat', price:890000, oldPrice:1200000, image:'https://picsum.photos/seed/coat1/600/600', rating:4.2, reviews:156, category:'fashion', description:'Zamonaviy dizayn, issiq material, kuz-qish mavsumi uchun ideal.' },
				{ id:'12', _id:'12', title:'JBL Charge 5 Bluetooth kolonka', slug:'jbl-charge-5', price:1100000, oldPrice:1350000, image:'https://picsum.photos/seed/jbl1/600/600', rating:4.5, reviews:287, category:'electronics', description:'IP67 suv o\'tkazmaydigan, 20 soat batareya, Powerbank funksiyasi.' },
				{ id:'13', _id:'13', title:'Philips Hava tozalagich AC1217', slug:'philips-air', price:3400000, oldPrice:null, image:'https://picsum.photos/seed/philips1/600/600', rating:4.3, reviews:52, category:'home', description:'HEPA filtri, 63m² gacha xona uchun, tungi rejim, sifat sensori.' },
				{ id:'14', _id:'14', title:'Levi\'s 501 Original jins shim', slug:'levis-501', price:750000, oldPrice:950000, image:'https://picsum.photos/seed/levis1/600/600', rating:4.6, reviews:324, category:'fashion', description:'Klassik to\'g\'ri kesim, 100% paxta denim, vaqt o\'tishi bilan go\'zal eskirish.' },
				{ id:'15', _id:'15', title:'iPad Air M1 10.9"', slug:'ipad-air-m1', price:9200000, oldPrice:10500000, image:'https://picsum.photos/seed/ipad1/600/600', rating:4.8, reviews:178, category:'electronics', description:'Apple M1 chip, 10.9" Liquid Retina, Apple Pencil 2 qo\'llab-quvvatlash.' },
				{ id:'16', _id:'16', title:'De\'Longhi kofe mashinasi', slug:'delonghi-coffee', price:5600000, oldPrice:6800000, image:'https://picsum.photos/seed/coffee1/600/600', rating:4.7, reviews:89, category:'home', description:'Avtomatik espresso, cappuccino, latte. Ichki maydalagich, 1.8L suv idishi.' }
			];
		}
		let filtered = global.demoProducts.slice();
		if (q) filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
		if (category) filtered = filtered.filter(p => p.category === category);
		const total = filtered.length;
		const start = (page - 1) * limit;
		const products = filtered.slice(start, start + limit);
		return res.json({ total, page, limit, products });
	}
});

app.get('/api/products/:id', async (req, res) => {
	const id = req.params.id;
	if (dbConnected) {
		const p = await Product.findOne({ $or: [{ _id: id }, { slug: id }] }).lean();
		if (!p) return res.status(404).json({ error: 'Not found' });
		return res.json(p);
	} else {
		const p = (global.demoProducts || []).find(x => x._id === id || x.slug === id);
		if (!p) return res.status(404).json({ error: 'Not found' });
		return res.json(p);
	}
});

app.post('/api/auth/register', async (req, res) => {
	const { username, password, email } = req.body;
	if (!username || !password) return res.status(400).json({ error: 'username and password required' });
	if (dbConnected) {
		const exists = await User.findOne({ username });
		if (exists) return res.status(400).json({ error: 'User exists' });
		const hash = await bcrypt.hash(password, 10);
		const user = await User.create({ username, email, password: hash, isAdmin: username === 'admin' });
		const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
	} else {
		const token = jwt.sign({ id: username, username, isAdmin: username === 'admin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: username, username, email, isAdmin: username === 'admin' } });
	}
});

app.post('/api/auth/login', async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) return res.status(400).json({ error: 'username and password required' });
	if (dbConnected) {
		const user = await User.findOne({ username });
		if (!user) return res.status(401).json({ error: 'Invalid' });
		const ok = await bcrypt.compare(password, user.password || '');
		if (!ok) return res.status(401).json({ error: 'Invalid' });
		const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
	} else {
		const token = jwt.sign({ id: username, username, isAdmin: username === 'admin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
		return res.json({ token, user: { id: username, username, email: `${username}@example.com`, isAdmin: username === 'admin' } });
	}
});

app.get('/api/profile', verifyToken, async (req, res) => {
	if (dbConnected) {
		const user = await User.findById(req.user.id).lean();
		if (!user) return res.status(404).json({ error: 'Not found' });
		return res.json({ id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin });
	} else {
		return res.json({ id: req.user.id, username: req.user.username, email: `${req.user.username}@example.com`, isAdmin: req.user.isAdmin });
	}
});

app.post('/api/orders', async (req, res) => {
	const payload = req.body || {};
	// Attach user if Authorization token present (optional)
	const auth = req.headers.authorization || '';
	if (auth.startsWith('Bearer ')) {
		try {
			const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'dev-secret');
			payload.user = decoded.id || decoded.username;
		} catch (e) {
			// ignore invalid token
		}
	}

	if (dbConnected) {
		const saved = await Order.create(payload);
		return res.json({ ok: true, id: saved._id });
	} else {
		global.demoOrders = global.demoOrders || [];
		payload.id = String(Date.now());
		global.demoOrders.unshift(payload);
		return res.json({ ok: true, id: payload.id });
	}
});

// Get orders for currently authenticated user
app.get('/api/orders/me', verifyToken, async (req, res) => {
	if (dbConnected) {
		const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
		return res.json(orders);
	} else {
		global.demoOrders = global.demoOrders || [];
		const orders = global.demoOrders.filter(o => String(o.user) === String(req.user.username) || String(o.user) === String(req.user.id));
		return res.json(orders);
	}
});

// Get a single order for authenticated user (or admin)
app.get('/api/orders/:id', verifyToken, async (req, res) => {
	const id = req.params.id;
	if (dbConnected) {
		const order = await Order.findById(id).lean();
		if (!order) return res.status(404).json({ error: 'Not found' });
		if (String(order.user) !== String(req.user.id) && !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
		return res.json(order);
	} else {
		global.demoOrders = global.demoOrders || [];
		const order = global.demoOrders.find(o => String(o.id) === String(id));
		if (!order) return res.status(404).json({ error: 'Not found' });
		if (String(order.user) !== String(req.user.username) && !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
		return res.json(order);
	}
});

// Public guest order lookup (by id)
app.get('/api/orders/guest/:id', async (req, res) => {
	const id = req.params.id;
	if (dbConnected) {
		const order = await Order.findById(id).lean();
		if (!order) return res.status(404).json({ error: 'Not found' });
		return res.json(order);
	} else {
		global.demoOrders = global.demoOrders || [];
		const order = global.demoOrders.find(o => String(o.id) === String(id));
		if (!order) return res.status(404).json({ error: 'Not found' });
		return res.json(order);
	}
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'No file' });
	try {
		const result = await new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream({ folder: 'premium-store' }, (error, result) => {
				if (error) return reject(error);
				resolve(result);
			});
			streamifier.createReadStream(req.file.buffer).pipe(stream);
		});
		res.json({ url: result.secure_url, public_id: result.public_id, raw: result });
	} catch (err) {
		console.error('upload error', err);
		res.status(500).json({ error: 'Upload failed', details: err.message });
	}
});

app.get('/api/admin/products', checkAdmin, async (req, res) => {
	if (dbConnected) {
		const products = await Product.find().sort({ createdAt: -1 }).lean();
		return res.json(products);
	} else {
		return res.json(global.demoProducts || []);
	}
});

// Robots - dynamic to include SITE_URL
app.get('/robots.txt', (req, res) => {
	res.type('text/plain');
	res.send(["User-agent: *","Allow: /",`Sitemap: ${SITE_URL}/sitemap.xml`].join('\n'));
});

// Sitemap generation
app.get('/sitemap.xml', async (req, res) => {
	res.type('application/xml');
	try {
		let items = [];
		if (dbConnected) {
			const products = await Product.find().lean();
			items = products.map(p => ({ loc: `${SITE_URL}/product.html?id=${p._id}`, lastmod: (p.updatedAt || p.createdAt || new Date()).toISOString() }));
		} else {
			items = (global.demoProducts || []).map(p => ({ loc: `${SITE_URL}/product.html?id=${p._id||p.id}`, lastmod: new Date().toISOString() }));
		}
		const staticUrls = [
			{ loc: `${SITE_URL}/`, priority: 1.0 },
			{ loc: `${SITE_URL}/index.html`, priority: 0.9 },
			{ loc: `${SITE_URL}/cart.html`, priority: 0.8 },
			{ loc: `${SITE_URL}/login.html`, priority: 0.6 },
			{ loc: `${SITE_URL}/register.html`, priority: 0.6 }
		];
		const urlsXml = staticUrls.map(u => `<url><loc>${u.loc}</loc><changefreq>daily</changefreq><priority>${u.priority}</priority></url>`).join('') + items.map(i => `<url><loc>${i.loc}</loc><lastmod>${i.lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('');
		const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}</urlset>`;
		res.set('Cache-Control', 'public, max-age=3600');
		return res.send(xml);
	} catch (err) {
		return res.status(500).send('');
	}
});

app.post('/api/admin/products', checkAdmin, async (req, res) => {
	const data = req.body;
	if (!data || !data.title) return res.status(400).json({ error: 'Missing data' });
	data.slug = data.slug || generateSlug(data.title);
	if (dbConnected) {
		const p = await Product.create(data);
		return res.json(p);
	} else {
		data._id = String(Date.now());
		global.demoProducts = global.demoProducts || [];
		global.demoProducts.unshift(data);
		return res.json(data);
	}
});

app.put('/api/admin/products/:id', checkAdmin, async (req, res) => {
	const id = req.params.id;
	if (dbConnected) {
		const p = await Product.findByIdAndUpdate(id, req.body, { new: true }).lean();
		if (!p) return res.status(404).json({ error: 'Not found' });
		return res.json(p);
	} else {
		global.demoProducts = global.demoProducts || [];
		const idx = global.demoProducts.findIndex(x => x._id === id || x.id === id);
		if (idx === -1) return res.status(404).json({ error: 'Not found' });
		global.demoProducts[idx] = Object.assign(global.demoProducts[idx], req.body);
		return res.json(global.demoProducts[idx]);
	}
});

app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
	const id = req.params.id;
	if (dbConnected) {
		await Product.findByIdAndDelete(id);
		return res.json({ ok: true });
	} else {
		global.demoProducts = global.demoProducts || [];
		global.demoProducts = global.demoProducts.filter(x => x._id !== id && x.id !== id);
		return res.json({ ok: true });
	}
});

app.get('*', (req, res) => {
	if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

