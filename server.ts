import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db, generateId } from './src/db';
import { User, AITool, Review, Order, CreditTransaction, UsageLog, ChatMessage, UserRole } from './src/types';

const PORT = 3000;
const app = express();
app.use(express.json());

// Initialize Gemini SDK with telemetry header
const GEMINI_KEY = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (GEMINI_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    console.log('Gemini AI Client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini Client:', err);
  }
} else {
  console.log('No GEMINI_API_KEY environment variable found. Server will run with high-fidelity local AI simulators.');
}

// Create native HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server on the same HTTP server
const wss = new WebSocketServer({ noServer: true });

// Attach WS upgrade handler
httpServer.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
  
  if (pathname === '/_vite_/' || request.headers['sec-websocket-protocol'] === 'vite-hmr') {
    return; // Let Vite handle HMR
  }
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Active WebSocket connections
interface ActiveConnection {
  ws: WebSocket;
  userId: string;
  name: string;
  role: UserRole;
  isAlive: boolean;
}
const activeClients = new Map<string, ActiveConnection>();

// Broadcast helper
function broadcastToAll(type: string, payload: any) {
  const messageStr = JSON.stringify({ type, payload });
  activeClients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

// Send to user helper
function sendToUser(userId: string, type: string, payload: any) {
  const conn = activeClients.get(userId);
  if (conn && conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify({ type, payload }));
  }
}

// Broadcast periodic analytics telemetry metrics
setInterval(() => {
  const activeUsersCount = activeClients.size;
  const totalUsers = db.getUsers().length;
  const toolsCount = db.getTools().length;
  const orders = db.getOrders();
  const totalSpending = orders.reduce((sum, o) => sum + o.amount, 0);

  const metrics = {
    activeUsers: activeUsersCount || 1,
    totalRegistrations: totalUsers,
    liveActivitiesCount: db.getUsageLogs().length + orders.length,
    cpuUsage: +(12 + Math.random() * 15).toFixed(1),
    memoryUsage: +(38 + Math.random() * 5).toFixed(1),
    toolApprovalRate: +(
      (db.getTools().filter(t => t.status === 'approved').length / (toolsCount || 1)) * 100
    ).toFixed(0),
    totalSpending
  };
  broadcastToAll('system_metrics', metrics);
}, 5000);

// WebSocket message handler
wss.on('connection', (ws: WebSocket) => {
  let clientSession: { userId: string; name: string; role: UserRole } | null = null;
  
  ws.on('message', (message: string) => {
    try {
      const { type, payload } = JSON.parse(message);
      
      switch (type) {
        case 'join': {
          const { userId, name, role } = payload;
          clientSession = { userId, name, role };
          
          activeClients.set(userId, {
            ws,
            userId,
            name,
            role,
            isAlive: true
          });
          
          db.addNotification(userId, 'Connected', 'Established secure real-time gateway connection.');
          
          // Broadcast presence updates
          broadcastToAll('user_joined', { userId, name, role });
          
          // Send active users list
          const activeUsersList = Array.from(activeClients.values()).map(c => ({
            userId: c.userId,
            name: c.name,
            role: c.role
          }));
          ws.send(JSON.stringify({ type: 'active_users', payload: activeUsersList }));
          break;
        }
        
        case 'chat_message': {
          if (!clientSession) return;
          const { recipientId, content } = payload;
          
          const newMsg: ChatMessage = {
            id: 'msg-' + generateId(),
            senderId: clientSession.userId,
            senderName: clientSession.name,
            senderRole: clientSession.role,
            recipientId: recipientId || 'global',
            content,
            timestamp: new Date().toISOString(),
            readStatus: 'unread'
          };
          
          db.addChatMessage(newMsg);
          
          if (recipientId && recipientId !== 'global') {
            sendToUser(recipientId, 'chat_message', newMsg);
            ws.send(JSON.stringify({ type: 'chat_message', payload: newMsg }));
          } else {
            broadcastToAll('chat_message', newMsg);
          }
          break;
        }
        
        case 'typing': {
          if (!clientSession) return;
          const { recipientId, isTyping } = payload;
          
          if (recipientId && recipientId !== 'global') {
            sendToUser(recipientId, 'typing', {
              userId: clientSession.userId,
              name: clientSession.name,
              isTyping
            });
          } else {
            broadcastToAll('typing', {
              userId: clientSession.userId,
              name: clientSession.name,
              isTyping,
              recipientId: 'global'
            });
          }
          break;
        }
        
        case 'pong':
          break;
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  });

  ws.on('close', () => {
    if (clientSession) {
      activeClients.delete(clientSession.userId);
      broadcastToAll('user_left', { userId: clientSession.userId, name: clientSession.name });
    }
  });
});

// Middleware for auth
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const user = db.getUsers().find(u => u.id === token);
    if (!user) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Authentication failed' });
  }
}

// ==========================================
// API REST ENDPOINTS
// ==========================================

// Authentication & Profile
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  }

  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email address already registered.' });
  }

  const newUser: User = {
    id: 'usr-' + generateId(),
    name,
    email,
    avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150`,
    role: role || 'user',
    status: 'active',
    credits: 500, // 500 free sign-up credits
    subscriptionPlan: 'free',
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);
  
  // Create first welcome transaction
  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: newUser.id,
    amount: 500,
    type: 'bonus',
    description: 'Welcome bonus credit allocation',
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ user: newUser, token: newUser.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Simplified credentials check for demo
  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'No account registered with this email.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This user account has been suspended by an admin.' });
  }

  res.json({ user, token: user.id });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Email address not found in our database.' });
  }
  res.json({ success: true, message: 'Password reset link dispatched via simulated SMTP mailer.' });
});

app.put('/api/users/profile', authenticateToken, (req: any, res) => {
  const { name, avatar, role, subscriptionPlan } = req.body;
  const updated = db.updateUser(req.user.id, { name, avatar, role, subscriptionPlan });
  if (!updated) return res.status(404).json({ error: 'User profile not found.' });
  res.json(updated);
});

// AI Tools Routes
app.get('/api/tools', (req, res) => {
  res.json(db.getTools());
});

app.get('/api/tools/:slug', (req, res) => {
  const tool = db.getTools().find(t => t.slug === req.params.slug);
  if (!tool) return res.status(404).json({ error: 'AI Tool not found in catalog.' });
  res.json(tool);
});

app.post('/api/tools', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only approved Creators or Administrators can publish tools.' });
  }

  const { title, description, longDescription, image, category, price, type, features, requirements, demoVideoUrl } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, category, and brief description are required.' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newTool: AITool = {
    id: 'tool-' + generateId(),
    title,
    slug,
    description,
    longDescription: longDescription || description,
    image: image || `https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400`,
    category,
    price: price || 0,
    type: type || 'free',
    rating: 5.0,
    users: 0,
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    creatorId: req.user.id,
    features: features || [],
    requirements: requirements || ['Standard web browser'],
    demoVideoUrl: demoVideoUrl || '',
    createdAt: new Date().toISOString()
  };

  db.addTool(newTool);
  
  const alertMsg = db.addNotification(
    req.user.role === 'admin' ? 'all' : 'usr-admin',
    req.user.role === 'admin' ? 'New AI Tool Live' : 'AI Tool Pending Approval',
    `Tool "${title}" was created by ${req.user.name}.`
  );
  broadcastToAll('notification', alertMsg);

  res.status(201).json(newTool);
});

app.put('/api/tools/:id', authenticateToken, (req: any, res) => {
  const tool = db.getTools().find(t => t.id === req.params.id);
  if (!tool) return res.status(404).json({ error: 'AI Tool not found.' });

  if (req.user.role !== 'admin' && tool.creatorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized: You do not own this AI Tool.' });
  }

  const updated = db.updateTool(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'AI Tool not found.' });

  res.json(updated);
});

app.delete('/api/tools/:id', authenticateToken, (req: any, res) => {
  const tool = db.getTools().find(t => t.id === req.params.id);
  if (!tool) return res.status(404).json({ error: 'AI Tool not found.' });

  if (req.user.role !== 'admin' && tool.creatorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized: You do not own this AI Tool.' });
  }

  db.deleteTool(req.params.id);
  res.json({ success: true });
});

// Reviews
app.get('/api/reviews/:toolId', (req, res) => {
  const reviews = db.getReviews().filter(r => r.toolId === req.params.toolId);
  res.json(reviews);
});

app.post('/api/reviews', authenticateToken, (req: any, res) => {
  const { toolId, rating, comment } = req.body;
  if (!toolId || !rating || !comment) {
    return res.status(400).json({ error: 'Tool ID, rating, and review comment are required.' });
  }

  const review: Review = {
    id: 'rev-' + generateId(),
    userId: req.user.id,
    userName: req.user.name,
    userAvatar: req.user.avatar,
    toolId,
    rating: Number(rating),
    comment,
    timestamp: new Date().toISOString()
  };

  db.addReview(review);
  res.status(201).json(review);
});

// Orders & Purchases
app.get('/api/orders', authenticateToken, (req: any, res) => {
  if (req.user.role === 'admin') {
    res.json(db.getOrders());
  } else {
    res.json(db.getOrders().filter(o => o.userId === req.user.id));
  }
});

app.post('/api/orders', authenticateToken, (req: any, res) => {
  const { toolId, paymentMethod } = req.body;
  const tool = db.getTools().find(t => t.id === toolId);
  if (!tool) return res.status(404).json({ error: 'AI Tool not found.' });

  const existingOrder = db.getOrders().find(o => o.userId === req.user.id && o.toolId === toolId);
  if (existingOrder && tool.type !== 'free') {
    return res.status(400).json({ error: 'You have already purchased a subscription/license for this tool.' });
  }

  const order: Order = {
    id: 'ord-' + generateId(),
    userId: req.user.id,
    userEmail: req.user.email,
    toolId: tool.id,
    toolTitle: tool.title,
    amount: tool.price,
    paymentStatus: 'completed',
    paymentMethod: paymentMethod || 'stripe',
    timestamp: new Date().toISOString()
  };

  db.addOrder(order);

  // Allocate 1000 bonus credits for purchasing pro tools
  if (tool.price > 0) {
    db.addTransaction({
      id: 'tx-' + generateId(),
      userId: req.user.id,
      amount: 1000,
      type: 'bonus',
      description: `Premium purchase bonus credits for ${tool.title}`,
      timestamp: new Date().toISOString()
    });
  }

  res.status(201).json(order);
});

// Credits & Wallets
app.get('/api/transactions', authenticateToken, (req: any, res) => {
  res.json(db.getTransactions().filter(t => t.userId === req.user.id));
});

app.post('/api/credits/add', authenticateToken, (req: any, res) => {
  const { amount, paymentMethod } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'A positive credit purchase amount is required.' });
  }

  // Cost mapping: $1 = 100 credits
  const cost = +(amount / 100).toFixed(2);

  const tx: CreditTransaction = {
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: Number(amount),
    type: 'purchase',
    description: `Topped up wallet with ${amount} credits (${paymentMethod || 'Stripe'})`,
    timestamp: new Date().toISOString()
  };

  db.addTransaction(tx);
  
  const alertMsg = db.addNotification(req.user.id, 'Wallet Recharged', `Your wallet has been credited with ${amount} credits.`);
  sendToUser(req.user.id, 'notification', alertMsg);

  res.json({ success: true, credits: req.user.credits + amount });
});

app.post('/api/credits/redeem', authenticateToken, (req: any, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Promo or voucher code is required.' });
  }

  const normalizedCode = code.trim().toUpperCase();
  if (normalizedCode === 'PRO DIGITAL' || normalizedCode === 'PRODIGITAL') {
    db.updateUser(req.user.id, { subscriptionPlan: 'pro' });

    const amount = 10000;
    const tx: CreditTransaction = {
      id: 'tx-' + generateId(),
      userId: req.user.id,
      amount,
      type: 'bonus',
      description: `Redeemed PRO DIGITAL coupon - Welcome to Pro Digital Plan!`,
      timestamp: new Date().toISOString()
    };
    db.addTransaction(tx);

    const alertMsg = db.addNotification(
      req.user.id,
      'Promo Activated',
      'Congratulations! You have successfully redeemed the PRO DIGITAL promo code. You have been upgraded to the Pro Digital plan with 10,000 bonus credits!'
    );
    sendToUser(req.user.id, 'notification', alertMsg);

    const updatedUser = db.getUsers().find(u => u.id === req.user.id);
    return res.json({
      success: true,
      message: 'Congratulations! Promo code PRO DIGITAL successfully redeemed.',
      user: updatedUser,
      credits: updatedUser ? updatedUser.credits : req.user.credits + amount
    });
  }

  return res.status(400).json({ error: 'Invalid or expired promotional code.' });
});

// Developer SDK API Simulation Endpoint
app.post('/api/developer/simulate-call', authenticateToken, (req: any, res) => {
  if (req.user.credits < 5) {
    return res.status(402).json({ error: 'Insufficient credits. Developer SDK API tests cost 5 credits.' });
  }

  const log: UsageLog = {
    id: 'usg-' + generateId(),
    userId: req.user.id,
    toolId: 'developer-sdk',
    toolTitle: 'Developer SDK API Call',
    prompt: 'POST /v1/execute (Simulated SDK Client Request)',
    result: '{"status":"success","model":"prodigital-chat-ultra","response":"API Request authenticated and processed successfully."}',
    creditsSpent: 5,
    timestamp: new Date().toISOString()
  };

  db.addUsageLog(log);

  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: -5,
    type: 'usage',
    description: 'Developer SDK API Call via Personal Key',
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'API request dispatched successfully. Status: 200 OK.',
    credits: req.user.credits - 5,
    log
  });
});

// User Admin Operations
app.get('/api/admin/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required.' });
  }
  res.json(db.getUsers());
});

app.put('/api/admin/users/:id/role', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required.' });
  }
  const { role } = req.body;
  const updated = db.updateUser(req.params.id, { role });
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  res.json(updated);
});

app.put('/api/admin/users/:id/suspend', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required.' });
  }
  const { status } = req.body; // 'active' | 'suspended'
  const updated = db.updateUser(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  res.json(updated);
});

// ==========================================
// WORKSPACE WORKFLOW EXECUTIONS (AI SYSTEMS)
// ==========================================

// 1. AI Writer API
app.post('/api/ai/writer', authenticateToken, async (req: any, res) => {
  const { prompt, toolId } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt content is required to write.' });
  }

  if (req.user.credits < 50) {
    return res.status(402).json({ error: 'Insufficient credits. AI Writer tasks cost 50 credits.' });
  }

  let generatedText = '';
  
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are ProDigital Writer, a highly sophisticated SaaS writing engine. Produce a detailed, beautiful, professionally formatted response in clear Markdown based on this request:\n\n${prompt}`,
      });
      generatedText = response.text || 'No response returned from model.';
    } catch (err: any) {
      console.error('Gemini Writer API Error:', err);
      generatedText = `[Gemini Integration Failure: ${err?.message || 'Unknown issue'}]\n\n*FALLBACK SEED*:\nHere is a professionally structured mock content based on your request:\n\n# Dynamic Generation Outcome\nThank you for choosing ProDigital Writer. Here is your copy:\n\n${prompt.toUpperCase()} is a critical component of modern SASS automation. Implementing this properly streamlines overhead and expands retention by up to 42% year-over-year.`;
    }
  } else {
    // Elegant sandbox fallback
    generatedText = `# ${prompt.split(' ').slice(0, 4).join(' ')}... (SaaS Sandbox Preview)

*Note: Set the \`GEMINI_API_KEY\` secret in Settings to activate real-time Gemini generation.*

Here is a high-fidelity copy outline tailored to your prompt:

## 1. Executive Summary
Implementing ideas surrounding **"${prompt}"** helps scale visual assets and optimizes lead capture channels by automating high-friction copywriting loops.

## 2. Key Action Items
- Establish key metrics for content engagement tracking.
- Distribute micro-content variations across active newsletters.
- Iteratively test different emotional headings for conversion.

---
Generated by ProDigital Writer Pro (Demo Node Engine).`;
  }

  const log: UsageLog = {
    id: 'usg-' + generateId(),
    userId: req.user.id,
    toolId: toolId || 'tool-write-1',
    toolTitle: 'ProDigital Writer Pro',
    prompt,
    result: generatedText,
    creditsSpent: 50,
    timestamp: new Date().toISOString()
  };

  db.addUsageLog(log);

  // Add credit transaction
  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: -50,
    type: 'usage',
    description: 'AI Copywriter Pro task execution',
    timestamp: new Date().toISOString()
  });

  res.json({ result: generatedText, credits: req.user.credits });
});

// 2. AI Chatbot API
app.post('/api/ai/chat', authenticateToken, async (req: any, res) => {
  const { message, history, toolId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  if (req.user.credits < 10) {
    return res.status(402).json({ error: 'Insufficient credits. AI Chat messages cost 10 credits.' });
  }

  let reply = '';

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          systemInstruction: "You are ProDigital Chat Ultra, a premium AI companion on the PRO DIGITAL™ platform. Be helpful, concise, smart, and friendly."
        }
      });
      reply = response.text || 'I am sorry, but I encountered an empty response.';
    } catch (err: any) {
      console.error('Gemini Chat API Error:', err);
      reply = `[Gemini Connection Alert] I am running on fallback support. You asked: "${message}". Set a valid GEMINI_API_KEY to speak with my live model.`;
    }
  } else {
    reply = `Hello! I am ProDigital Chat Ultra, running in high-fidelity demo sandbox. You asked: "${message}". Setup your GEMINI_API_KEY to start live conversational threads with actual Gemini 3.5 models!`;
  }

  const log: UsageLog = {
    id: 'usg-' + generateId(),
    userId: req.user.id,
    toolId: toolId || 'tool-chat-1',
    toolTitle: 'ProDigital Chat Ultra',
    prompt: message,
    result: reply,
    creditsSpent: 10,
    timestamp: new Date().toISOString()
  };

  db.addUsageLog(log);

  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: -10,
    type: 'usage',
    description: 'ProDigital Chat Ultra prompt query',
    timestamp: new Date().toISOString()
  });

  res.json({ result: reply, credits: req.user.credits });
});

// 3. AI Image Generation API
app.post('/api/ai/image', authenticateToken, async (req: any, res) => {
  const { prompt, aspectRatio, toolId } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Image generation prompt is required.' });
  }

  if (req.user.credits < 150) {
    return res.status(402).json({ error: 'Insufficient credits. Generating high-resolution images costs 150 credits.' });
  }

  let imageUrl = '';
  let isRealGeminiGen = false;

  if (aiClient) {
    try {
      // Calls Gemini Image generation model
      const imageResponse = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: [{ text: prompt }],
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '1:1'
          }
        }
      });

      // Find the base64 image part in candidates
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          isRealGeminiGen = true;
          break;
        }
      }
    } catch (err: any) {
      console.error('Gemini Image API Error:', err);
    }
  }

  if (!imageUrl) {
    // Curated Unsplash fallback that corresponds elegantly to user's keyword prompt
    const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(','));
    imageUrl = `https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80&sig=${Math.floor(Math.random() * 1000)}`;
  }

  const log: UsageLog = {
    id: 'usg-' + generateId(),
    userId: req.user.id,
    toolId: toolId || 'tool-image-1',
    toolTitle: 'ProDigital Art Studio',
    prompt,
    result: imageUrl,
    creditsSpent: 150,
    timestamp: new Date().toISOString()
  };

  db.addUsageLog(log);

  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: -150,
    type: 'usage',
    description: `ProDigital Art Studio image synthesis (${aspectRatio || '1:1'})`,
    timestamp: new Date().toISOString()
  });

  res.json({ 
    imageUrl, 
    credits: req.user.credits, 
    isRealGen: isRealGeminiGen,
    message: isRealGeminiGen ? 'Successfully synthesized image with Gemini!' : 'Sandbox fallback image served. Set your GEMINI_API_KEY to use actual generative models.'
  });
});

// 4. AI Video Generation API (Simulation + polling mock)
app.post('/api/ai/video', authenticateToken, async (req: any, res) => {
  const { script, toolId } = req.body;
  if (!script) {
    return res.status(400).json({ error: 'Video script is required.' });
  }

  if (req.user.credits < 300) {
    return res.status(402).json({ error: 'Insufficient credits. AI Video rendering costs 300 credits.' });
  }

  // Videos render dynamically on the client utilizing scenic layouts.
  // We will return a beautiful compiled video screenplay, outline, and matching placeholder videos.
  const sampleVideos = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4'
  ];
  const chosenVideo = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

  const log: UsageLog = {
    id: 'usg-' + generateId(),
    userId: req.user.id,
    toolId: toolId || 'tool-video-1',
    toolTitle: 'ProDigital Video Generator',
    prompt: script,
    result: chosenVideo,
    creditsSpent: 300,
    timestamp: new Date().toISOString()
  };

  db.addUsageLog(log);

  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: -300,
    type: 'usage',
    description: 'ProDigital Video Generator script render',
    timestamp: new Date().toISOString()
  });

  res.json({ videoUrl: chosenVideo, credits: req.user.credits });
});

// 5. AI Speech Synthetic TTS API
app.post('/api/ai/voice', authenticateToken, async (req: any, res) => {
  const { text, voiceName, toolId } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text content to speak is required.' });
  }

  if (req.user.credits < 100) {
    return res.status(402).json({ error: 'Insufficient credits. Speech TTS synthesis costs 100 credits.' });
  }

  let audioBase64 = '';
  let isRealTTS = false;

  if (aiClient) {
    try {
      const ttsResponse = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Read cleanly and naturally: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' }
            }
          }
        }
      });

      const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioPart) {
        audioBase64 = audioPart;
        isRealTTS = true;
      }
    } catch (err) {
      console.error('Gemini TTS voice generation failed, using fallback speech API.', err);
    }
  }

  const log: UsageLog = {
    id: 'usg-' + generateId(),
    userId: req.user.id,
    toolId: toolId || 'tool-voice-1',
    toolTitle: 'ProDigital Speech Synthetic TTS',
    prompt: text,
    result: 'Voice synthesized successfully',
    creditsSpent: 100,
    timestamp: new Date().toISOString()
  };

  db.addUsageLog(log);

  db.addTransaction({
    id: 'tx-' + generateId(),
    userId: req.user.id,
    amount: -100,
    type: 'usage',
    description: `ProDigital Speech Synthetic TTS voice synthesis (${voiceName || 'Zephyr'})`,
    timestamp: new Date().toISOString()
  });

  res.json({ 
    audioBase64, 
    credits: req.user.credits, 
    isRealTTS,
    message: isRealTTS ? 'Synthetic audio generated with Gemini.' : 'Browser HTML5 voice synth active.'
  });
});

// Notifications REST endpoints
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const list = db.getNotifications().filter(n => n.userId === 'all' || n.userId === req.user.id);
  res.json(list);
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', authenticateToken, (req: any, res) => {
  db.markAllNotificationsRead(req.user.id);
  res.json({ success: true });
});

// User profile logs & activity details
app.get('/api/logs', authenticateToken, (req, res) => {
  res.json(db.getUsageLogs());
});

app.get('/api/chat', authenticateToken, (req: any, res) => {
  const messages = db.getChatMessages().filter(
    msg =>
      msg.recipientId === 'global' ||
      msg.senderId === req.user.id ||
      msg.recipientId === req.user.id
  );
  res.json(messages);
});

// Bootstrap application & serve Static client
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Critical boot failure:', err);
});
