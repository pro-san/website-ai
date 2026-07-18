import fs from 'fs';
import path from 'path';
import { 
  User, 
  AITool, 
  Category, 
  Review, 
  Order, 
  CreditTransaction, 
  UsageLog, 
  Notification, 
  ChatMessage 
} from './types';

interface DatabaseSchema {
  users: User[];
  aiTools: AITool[];
  categories: Category[];
  reviews: Review[];
  orders: Order[];
  transactions: CreditTransaction[];
  usageLogs: UsageLog[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

export const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr-admin',
      name: 'Sarah Connor (Admin)',
      email: 'admin@prodigital.net',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'admin',
      status: 'active',
      credits: 5000,
      subscriptionPlan: 'business',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-creator',
      name: 'Tony Stark (Creator)',
      email: 'creator@prodigital.net',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'creator',
      status: 'active',
      credits: 2000,
      subscriptionPlan: 'pro',
      subscriptionExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr-customer',
      name: 'Peter Parker',
      email: 'user@prodigital.net',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      role: 'user',
      status: 'active',
      credits: 250,
      subscriptionPlan: 'free',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  categories: [
    { id: 'cat-chat', name: 'AI Chat', icon: 'MessageSquare' },
    { id: 'cat-writing', name: 'AI Writing', icon: 'FileText' },
    { id: 'cat-image', name: 'AI Image', icon: 'Image' },
    { id: 'cat-video', name: 'AI Video', icon: 'Video' },
    { id: 'cat-voice', name: 'AI Voice', icon: 'Mic' },
    { id: 'cat-music', name: 'AI Music', icon: 'Music' },
    { id: 'cat-automation', name: 'AI Automation', icon: 'Cpu' },
    { id: 'cat-coding', name: 'AI Coding', icon: 'Code' },
    { id: 'cat-marketing', name: 'Marketing AI', icon: 'TrendingUp' },
    { id: 'cat-business', name: 'Business AI', icon: 'Briefcase' }
  ],
  aiTools: [
    {
      id: 'tool-chat-1',
      title: 'ProDigital Chat Ultra',
      slug: 'prodigital-chat-ultra',
      description: 'Ultra-fast conversational intelligence engine powered by Gemini Flash for reasoning & context parsing.',
      longDescription: 'ProDigital Chat Ultra represents the pinnacle of instant customer engagement, research automation, and cognitive problem-solving. Trained on extensive multi-modal datasets, it excels at digesting raw code repositories, legal drafts, creative briefs, and scientific studies with near-zero latency. Built for teams requiring real-time, context-aware assistance, it acts as an intelligent co-pilot for any workflow.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400',
      category: 'AI Chat',
      price: 0,
      type: 'free',
      rating: 4.8,
      users: 1420,
      status: 'approved',
      creatorId: 'usr-creator',
      features: [
        'Multi-lingual real-time translation support',
        'Advanced JSON and CSV file uploading and analysis',
        'Direct system integration via flexible API access keys',
        'Custom personal assistant prompts and custom temperature setting'
      ],
      requirements: [
        'Web browser (Chrome, Safari, Firefox, Edge)',
        'Active internet connection'
      ],
      demoVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tool-write-1',
      title: 'ProDigital Writer Pro',
      slug: 'prodigital-writer-pro',
      description: 'Premium AI Copywriting & Blog drafting tool. Craft high-converting blogs, ads, and SEO articles.',
      longDescription: 'ProDigital Writer Pro is an advanced writing ecosystem engineered to supercharge your content marketing funnel. Say goodbye to writers block. With structured templates for SEO landing pages, catchy email headlines, cold sales letters, and standard corporate reports, ProDigital Writer matches your specific brand tone perfectly. It optimizes readability, tracks SEO keywords, and outputs clean formatted Markdown.',
      image: 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=400',
      category: 'AI Writing',
      price: 15,
      type: 'pro',
      rating: 4.6,
      users: 820,
      status: 'approved',
      creatorId: 'usr-creator',
      features: [
        'Instant SEO keyword density tracker & optimizer',
        'Tone analyzer (Professional, Playful, Persuasive, Bold)',
        'Built-in plagiarism checking API integration',
        'One-click export to PDF, Word, or formatted Markdown'
      ],
      requirements: [
        'Modern web browser',
        'Pro active subscription plan or standard token allocation'
      ],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tool-image-1',
      title: 'ProDigital Art Studio',
      slug: 'prodigital-art-studio',
      description: 'State-of-the-art text-to-image generator using custom Diffusion nodes for artistic & photorealistic outputs.',
      longDescription: 'ProDigital Art Studio bridges raw imagination and professional design. Utilizing next-generation deep latent neural models, it produces vivid high-resolution textures, responsive concept art, premium social banners, and ultra-crisp architectural visual renders. Feed in a textual prompt, adjust desired dimensions, styles, or reference images, and witness stunning visuals generated in under 3 seconds.',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      category: 'AI Image',
      price: 29,
      type: 'pro',
      rating: 4.9,
      users: 1950,
      status: 'approved',
      creatorId: 'usr-creator',
      features: [
        'Resolutions support up to 4K ultra-sharp output',
        'Custom aspect-ratio config (1:1, 16:9, 9:16, 4:3)',
        'Style preset options (Photorealistic, Cyberpunk, 3D Render, Anime)',
        'Reference image blending and style transfer controls'
      ],
      requirements: [
        'Requires modern GPU acceleration simulation (handled server-side)',
        'Stable network connection'
      ],
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tool-video-1',
      title: 'ProDigital Video Generator',
      slug: 'prodigital-video-generator',
      description: 'Generate stunning social-media marketing clips, presentations, and product explainers from simple prompt scripts.',
      longDescription: 'ProDigital Video Generator empowers creators, advertisers, and startup founders to produce cinematic, highly engaging short videos without expensive software, recording setups, or rendering farms. Simply paste your script or prompt description, pick a visual theme, and let ProDigital Video compile synchronized animations, high-fidelity stock assets, and AI-synthesized backing tracks into a seamless MP4 container.',
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
      category: 'AI Video',
      price: 49,
      type: 'business',
      rating: 4.7,
      users: 320,
      status: 'approved',
      creatorId: 'usr-creator',
      features: [
        'Complete script-to-video compilation logic',
        'Auto-synchronized subtitles, headings, and visual accents',
        'High-quality voiceover generation (choose male/female accents)',
        'Integrated library of stock backgrounds and dynamic filters'
      ],
      requirements: [
        'Requires Business subscription or premium token credits',
        'Optimized for desktop rendering previews'
      ],
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tool-voice-1',
      title: 'ProDigital Speech Synthetic TTS',
      slug: 'prodigital-speech-synthetic-tts',
      description: 'Natural text-to-speech engine with custom emotive inflection, accent options, and audio formatting controls.',
      longDescription: 'ProDigital Speech Synthetic TTS breathes life into written text. Whether you are creating audiobooks, training voiceovers, video-game dialogues, or telephone IVR systems, ProDigital Speech generates human-like synthetic voices that capture pauses, deep emotional pitches, and realistic inflections. Support includes multi-speaker scripts, adjustable speeds, and lossless file formats.',
      image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
      category: 'AI Voice',
      price: 19,
      type: 'pro',
      rating: 4.5,
      users: 540,
      status: 'approved',
      creatorId: 'usr-creator',
      features: [
        'Ultra-low latency, real-time audio playback streams',
        'Dozens of gender, accent, and regional tone parameters',
        'Multi-speaker conversation scripting editor support',
        'Downloadable as WAV, high-bitrate MP3, or OGG containers'
      ],
      requirements: [
        'Web Audio API compatible client browser',
        'Active subscription'
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  reviews: [
    {
      id: 'rev-1',
      userId: 'usr-customer',
      userName: 'Peter Parker',
      userAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      toolId: 'tool-chat-1',
      rating: 5,
      comment: 'ProDigital Chat Ultra is incredibly fast! I uploaded a 500-page dataset, and it generated a perfect executive summary in under 2 seconds. Recommended!',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'rev-2',
      userId: 'usr-customer',
      userName: 'Peter Parker',
      userAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      toolId: 'tool-image-1',
      rating: 4,
      comment: 'The texture details are sublime, though I wish there were more fine-grained controls for inpainting. Truly remarkable generation speeds!',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  orders: [
    {
      id: 'ord-1',
      userId: 'usr-customer',
      userEmail: 'user@prodigital.net',
      toolId: 'tool-write-1',
      toolTitle: 'ProDigital Writer Pro',
      amount: 15,
      paymentStatus: 'completed',
      paymentMethod: 'stripe',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      userId: 'usr-customer',
      amount: 500,
      type: 'bonus',
      description: 'Account signup registration welcome credits',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-2',
      userId: 'usr-customer',
      amount: -250,
      type: 'usage',
      description: 'ProDigital Art Studio image creation task run',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  usageLogs: [
    {
      id: 'log-1',
      userId: 'usr-customer',
      toolId: 'tool-image-1',
      toolTitle: 'ProDigital Art Studio',
      prompt: 'A sleek retro-futuristic hoverbike parked outside a neon-lit cyberpunk noodle shop, digital art 4k',
      result: 'Image generated successfully',
      creditsSpent: 250,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'usr-admin',
      title: 'Welcome to PRO DIGITAL™',
      message: 'The AI Tools Marketplace is online and primed. All systems active.',
      readStatus: 'unread',
      createdAt: new Date().toISOString()
    }
  ],
  chatMessages: [
    {
      id: 'msg-1',
      senderId: 'usr-admin',
      senderName: 'Sarah Connor',
      senderRole: 'admin',
      recipientId: 'global',
      content: 'Welcome to the PRO DIGITAL™ live developer & peer support chat room!',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      readStatus: 'read'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        const merged: DatabaseSchema = {
          users: parsed.users || INITIAL_DATA.users,
          aiTools: parsed.aiTools || parsed.tools || INITIAL_DATA.aiTools,
          categories: parsed.categories || INITIAL_DATA.categories,
          reviews: parsed.reviews || INITIAL_DATA.reviews,
          orders: parsed.orders || INITIAL_DATA.orders,
          transactions: parsed.transactions || INITIAL_DATA.transactions,
          usageLogs: parsed.usageLogs || INITIAL_DATA.usageLogs,
          notifications: parsed.notifications || INITIAL_DATA.notifications,
          chatMessages: parsed.chatMessages || INITIAL_DATA.chatMessages,
        };
        
        // Save back if missing critical fields
        if (!parsed.aiTools || !parsed.categories || !parsed.reviews || !parsed.orders || !parsed.transactions || !parsed.usageLogs) {
          this.save(merged);
        }
        
        return merged;
      }
    } catch (e) {
      console.error('Failed to read db file, using defaults:', e);
    }
    this.save(INITIAL_DATA);
    return INITIAL_DATA;
  }

  private save(newData: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  // Users
  public getUsers(): User[] { return this.data.users; }
  public addUser(user: User): User {
    this.data.users.push(user);
    this.save(this.data);
    this.addLog(user.id, `User registered: ${user.email}`);
    return user;
  }
  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save(this.data);
    return user;
  }
  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.save(this.data);
    return true;
  }

  // AI Tools
  public getTools(): AITool[] { return this.data.aiTools; }
  public addTool(tool: AITool): AITool {
    this.data.aiTools.push(tool);
    this.save(this.data);
    this.addLog(tool.creatorId, `Submitted AI Tool: ${tool.title}`);
    return tool;
  }
  public updateTool(id: string, updates: Partial<AITool>): AITool | null {
    const tool = this.data.aiTools.find(t => t.id === id);
    if (!tool) return null;
    Object.assign(tool, updates);
    this.save(this.data);
    return tool;
  }
  public deleteTool(id: string): boolean {
    const idx = this.data.aiTools.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.aiTools.splice(idx, 1);
    this.save(this.data);
    return true;
  }

  // Categories
  public getCategories(): Category[] { return this.data.categories; }

  // Reviews
  public getReviews(): Review[] { return this.data.reviews; }
  public addReview(review: Review): Review {
    this.data.reviews.unshift(review);
    
    // Recalculate average rating of tool
    const toolReviews = this.data.reviews.filter(r => r.toolId === review.toolId);
    const avg = toolReviews.reduce((sum, r) => sum + r.rating, 0) / (toolReviews.length || 1);
    const tool = this.data.aiTools.find(t => t.id === review.toolId);
    if (tool) {
      tool.rating = +(avg.toFixed(1));
    }

    this.save(this.data);
    return review;
  }

  // Orders
  public getOrders(): Order[] { return this.data.orders; }
  public addOrder(order: Order): Order {
    this.data.orders.unshift(order);
    
    // Increment users count on tool
    const tool = this.data.aiTools.find(t => t.id === order.toolId);
    if (tool) {
      tool.users += 1;
    }

    this.save(this.data);
    this.addLog(order.userId, `Purchased tool/subscription for ${order.toolTitle}`);
    return order;
  }

  // Transactions
  public getTransactions(): CreditTransaction[] { return this.data.transactions; }
  public addTransaction(tx: CreditTransaction): CreditTransaction {
    this.data.transactions.unshift(tx);
    
    // Adjust user credit wallet
    const user = this.data.users.find(u => u.id === tx.userId);
    if (user) {
      user.credits += tx.amount;
    }

    this.save(this.data);
    return tx;
  }

  // Usage Logs
  public getUsageLogs(): UsageLog[] { return this.data.usageLogs; }
  public addUsageLog(log: UsageLog): UsageLog {
    this.data.usageLogs.unshift(log);
    
    // Deduct credits from user
    const user = this.data.users.find(u => u.id === log.userId);
    if (user) {
      user.credits = Math.max(0, user.credits - log.creditsSpent);
    }

    this.save(this.data);
    return log;
  }

  // Notifications
  public getNotifications(): Notification[] { return this.data.notifications; }
  public addNotification(userId: string, title: string, message: string): Notification {
    const notif: Notification = {
      id: 'notif-' + generateId(),
      userId,
      title,
      message,
      readStatus: 'unread',
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.save(this.data);
    return notif;
  }
  public markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.readStatus = 'read';
    this.save(this.data);
    return true;
  }
  public markAllNotificationsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.userId === userId || n.userId === 'all') {
        n.readStatus = 'read';
      }
    });
    this.save(this.data);
  }

  // ChatMessages
  public getChatMessages(): ChatMessage[] { return this.data.chatMessages; }
  public addChatMessage(msg: ChatMessage): ChatMessage {
    this.data.chatMessages.push(msg);
    if (this.data.chatMessages.length > 200) {
      this.data.chatMessages.shift();
    }
    this.save(this.data);
    return msg;
  }

  // Logs (compatible with earlier helper system logger)
  public addLog(userId: string, action: string): void {
    const userObj = this.data.users.find(u => u.id === userId);
    const userName = userObj ? userObj.name : 'Unknown';
    
    const notif = this.addNotification(userId, 'Activity Registered', action);
    console.log(`[DB LOG] User: ${userName} | Action: ${action}`);
  }
}

export const db = new Database();
