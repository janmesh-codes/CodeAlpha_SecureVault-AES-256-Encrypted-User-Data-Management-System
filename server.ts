import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Initialize Gemini API client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Master Cryptographic Key derived securely from environment secret
const MASTER_KEY_SALT = "secure_vault_salt_2026";
const MASTER_KEY_SOURCE = process.env.GEMINI_API_KEY || "fallback_development_master_key_for_secure_vault_simulation";
const MASTER_KEY = crypto.scryptSync(MASTER_KEY_SOURCE, MASTER_KEY_SALT, 32);

// Server-side Encryption helpers (AES-256-GCM)
function encryptAES(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

function decryptAES(ciphertext: string, ivHex: string, tagHex: string): string {
  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Decryption Error: Verification failed (ciphertext has been tampered with or key is invalid)]";
  }
}

// Simulated SQL Injection Regex Patterns for WAF
const SQLI_PATTERNS = [
  {
    name: "Tautology Alert",
    regex: /\b(or|and)\b\s+['"\d\w]+\s*=\s*['"\d\w]+/i,
    description: "Pattern matching a statement that always resolves to TRUE (e.g. '1'='1' or OR 1=1)"
  },
  {
    name: "Union Select Exploit",
    regex: /\bunion\b\s+(all\s+)?\bselect\b/i,
    description: "Attempting to retrieve arbitrary records by appending additional select sets (e.g. UNION SELECT)"
  },
  {
    name: "Inline Comments / Query Breakout",
    regex: /(--|#|\/\*)/i,
    description: "Use of SQL comments to terminate the original query and bypass remainder syntax (e.g. -- or #)"
  },
  {
    name: "Piggybacked Command Stack",
    regex: /;\s*\b(drop|delete|insert|update|select|alter)\b/i,
    description: "Attempting to execute stacked database commands sequentially using a semicolon delimiter"
  },
  {
    name: "Special SQL Functions/Operators",
    regex: /\b(xp_cmdshell|exec|sp_executesql|load_file|into\s+outfile)\b/i,
    description: "Abusing high-privilege system operations, custom execution models, or file exports"
  }
];

// Helper to audit inputs for SQLi
function scanForSQLi(input: string): { isSqli: boolean; matchedPatterns: string[] } {
  const matchedPatterns: string[] = [];
  if (!input) return { isSqli: false, matchedPatterns };
  
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.regex.test(input)) {
      matchedPatterns.push(`${pattern.name}: ${pattern.description}`);
    }
  }
  return {
    isSqli: matchedPatterns.length > 0,
    matchedPatterns
  };
}

// Virtual Database State
interface VirtualUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  email: string;
  secretCode: string;
  masterPasswordHash: string; // bcrypt simulation
}

interface VirtualVault {
  id: string;
  userId: string;
  title: string;
  category: 'credential' | 'api_key' | 'secure_note';
  encryptedData: string;
  iv: string;
  tag: string;
  createdAt: string;
}

interface VirtualLog {
  id: string;
  eventType: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  payload: string;
  severity: 'info' | 'warning' | 'critical';
  isBlocked: boolean;
  timestamp: string;
}

// Initial Simulated Data
const virtualUsers: VirtualUser[] = [
  {
    id: "u-1",
    username: "admin",
    role: "admin",
    email: "security_officer@securevault.io",
    secretCode: "SV-9928-X",
    masterPasswordHash: "$2b$12$K8M8hH0A7wD3f0tHq8sR8e7V8G5S4K3L2M1O9z8y7x6w5v4u3t2s1" // Simulated bcrypt hash
  },
  {
    id: "u-2",
    username: "alice",
    role: "user",
    email: "alice@securevault.io",
    secretCode: "SV-4839-A",
    masterPasswordHash: "$2b$12$L8M8hH0A7wD3f0tHq8sR8e7V8G5S4K3L2M1O9z8y7x6w5v4u3t2s2"
  },
  {
    id: "u-3",
    username: "bob",
    role: "user",
    email: "bob@securevault.io",
    secretCode: "SV-2910-B",
    masterPasswordHash: "$2b$12$M8M8hH0A7wD3f0tHq8sR8e7V8G5S4K3L2M1O9z8y7x6w5v4u3t2s3"
  },
  {
    id: "u-4",
    username: "eve",
    role: "user",
    email: "eve@hacker_corp.com",
    secretCode: "SV-1337-H",
    masterPasswordHash: "$2b$12$N8M8hH0A7wD3f0tHq8sR8e7V8G5S4K3L2M1O9z8y7x6w5v4u3t2s4"
  }
];

// Helper to encrypt records on initialization
const initEncrypted1 = encryptAES("SuperSecretAPIKey_sk_live_51Msz8ZpLg8wKy7vX9z");
const initEncrypted2 = encryptAES("Production Server SSH Key: ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3f...");
const initEncrypted3 = encryptAES("Corporate Database Login: user=db_admin password=SuperSecurePassword2026!");

const virtualVaultItems: VirtualVault[] = [
  {
    id: "v-1",
    userId: "u-2", // Alice
    title: "Stripe Production API Key",
    category: "api_key",
    encryptedData: initEncrypted1.ciphertext,
    iv: initEncrypted1.iv,
    tag: initEncrypted1.tag,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString() // 5 days ago
  },
  {
    id: "v-2",
    userId: "u-3", // Bob
    title: "Primary Cloud SSH Key",
    category: "credential",
    encryptedData: initEncrypted2.ciphertext,
    iv: initEncrypted2.iv,
    tag: initEncrypted2.tag,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: "v-3",
    userId: "u-1", // Admin
    title: "SQL Production Host Login",
    category: "credential",
    encryptedData: initEncrypted3.ciphertext,
    iv: initEncrypted3.iv,
    tag: initEncrypted3.tag,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  }
];

const virtualLogs: VirtualLog[] = [
  {
    id: "log-1",
    eventType: "login_success",
    username: "admin",
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0",
    payload: "Session token generated: SV-ADMIN-SESSION",
    severity: "info",
    isBlocked: false,
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "log-2",
    eventType: "sqli_blocked",
    username: "anonymous",
    ipAddress: "185.220.101.44",
    userAgent: "sqlmap/1.8.2#stable (https://sqlmap.org)",
    payload: "username: ' UNION SELECT null, username, masterPasswordHash FROM users --",
    severity: "critical",
    isBlocked: true,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "log-3",
    eventType: "login_failed",
    username: "root",
    ipAddress: "45.138.89.21",
    userAgent: "Hydra v9.5 (brute force module)",
    payload: "Authentication failed for user 'root' (invalid credentials)",
    severity: "warning",
    isBlocked: false,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "log-4",
    eventType: "aes_encryption",
    username: "alice",
    ipAddress: "192.168.1.112",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.4",
    payload: "AES-256-GCM record created: 'Stripe Production API Key'",
    severity: "info",
    isBlocked: false,
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString()
  }
];

// In-memory sessions representation
const activeSessions = new Map<string, { userId: string; username: string; role: 'admin' | 'user' }>();

// Logger helper function
function writeLog(
  eventType: string, 
  username: string, 
  ipAddress: string, 
  userAgent: string, 
  payload: string, 
  severity: 'info' | 'warning' | 'critical',
  isBlocked: boolean
) {
  const newLog: VirtualLog = {
    id: `log-${crypto.randomUUID()}`,
    eventType,
    username: username || "anonymous",
    ipAddress: ipAddress || "127.0.0.1",
    userAgent: userAgent || "Unknown Client",
    payload,
    severity,
    isBlocked,
    timestamp: new Date().toISOString()
  };
  virtualLogs.unshift(newLog); // Prepend to show most recent logs first
  return newLog;
}

// API Routes

// Authentication API
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || "127.0.0.1";
  const ua = req.headers["user-agent"] || "Unknown";

  // WAF filter check
  const check = scanForSQLi(username || "");
  if (check.isSqli) {
    writeLog("sqli_blocked", "anonymous", ip, ua, `Malicious login username attempt: ${username}`, "critical", true);
    return res.status(403).json({ 
      success: false, 
      error: "Request blocked by SecureVault Web Application Firewall (WAF)!",
      blocked: true,
      patterns: check.matchedPatterns
    });
  }

  // Virtual login check
  const user = virtualUsers.find(u => u.username.toLowerCase() === (username || "").toLowerCase().trim());
  
  if (user) {
    // Standard mock credentials
    // For educational simplicity, the password can match the username to log in
    if (password === username) {
      const token = `SV-SESSION-${crypto.randomBytes(16).toString("hex")}`;
      activeSessions.set(token, {
        userId: user.id,
        username: user.username,
        role: user.role
      });
      writeLog("login_success", user.username, ip, ua, `User successfully logged in via interactive portal`, "info", false);
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          secretCode: user.secretCode
        }
      });
    }
  }

  writeLog("login_failed", username || "unknown", ip, ua, `Failed login credentials submitted for: ${username}`, "warning", false);
  return res.status(401).json({ success: false, error: "Invalid username or password" });
});

// Authenticated vault fetch
app.get("/api/vault", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized session" });
  }
  const token = authHeader.replace("Bearer ", "");
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Session expired or invalid" });
  }

  // Retrieve vault items belonging to user or all items if admin
  const items = virtualVaultItems
    .filter(item => session.role === "admin" || item.userId === session.userId)
    .map(item => ({
      id: item.id,
      userId: item.userId,
      title: item.title,
      category: item.category,
      encryptedData: item.encryptedData,
      iv: item.iv,
      tag: item.tag,
      createdAt: item.createdAt,
      ownerUsername: virtualUsers.find(u => u.id === item.userId)?.username || "unknown"
    }));

  res.json({ success: true, items });
});

// Decrypt vault item (requires token and correct ownership)
app.post("/api/vault/decrypt", (req, res) => {
  const { itemId } = req.body;
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Unauthorized session" });
  
  const token = authHeader.replace("Bearer ", "");
  const session = activeSessions.get(token);
  if (!session) return res.status(401).json({ error: "Session expired" });

  const item = virtualVaultItems.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Vault item not found" });

  // Access control check (only owner or admin)
  if (session.role !== "admin" && item.userId !== session.userId) {
    writeLog("unauthorized_access", session.username, req.ip || "127.0.0.1", req.headers["user-agent"] || "Unknown", `Attempted unauthorized decryption of record ${itemId}`, "critical", false);
    return res.status(403).json({ error: "Access Denied: Unprivileged decrypt request" });
  }

  // Perform secure decryption on the server
  const decrypted = decryptAES(item.encryptedData, item.iv, item.tag);
  
  writeLog("aes_decryption", session.username, req.ip || "127.0.0.1", req.headers["user-agent"] || "Unknown", `AES-256 decrypted item: '${item.title}'`, "info", false);

  res.json({ success: true, decrypted });
});

// Add new secure vault item
app.post("/api/vault", (req, res) => {
  const { title, category, rawText } = req.body;
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Unauthorized session" });

  const token = authHeader.replace("Bearer ", "");
  const session = activeSessions.get(token);
  if (!session) return res.status(401).json({ error: "Session expired" });

  const ip = req.ip || "127.0.0.1";
  const ua = req.headers["user-agent"] || "Unknown";

  // WAF check on Title and Text Content
  const titleCheck = scanForSQLi(title || "");
  const contentCheck = scanForSQLi(rawText || "");

  if (titleCheck.isSqli || contentCheck.isSqli) {
    const offendingPayload = titleCheck.isSqli ? `Title: ${title}` : `Content: ${rawText}`;
    writeLog("sqli_blocked", session.username, ip, ua, `SQL Injection blocked in vault creation! Input: ${offendingPayload}`, "critical", true);
    return res.status(403).json({
      success: false,
      error: "WAF block: Malicious SQL patterns detected in vault parameters!",
      blocked: true,
      patterns: [...titleCheck.matchedPatterns, ...contentCheck.matchedPatterns]
    });
  }

  // AES Encryption process on the server
  const cryptoResult = encryptAES(rawText || "");
  
  const newItem: VirtualVault = {
    id: `v-${crypto.randomUUID()}`,
    userId: session.userId,
    title,
    category,
    encryptedData: cryptoResult.ciphertext,
    iv: cryptoResult.iv,
    tag: cryptoResult.tag,
    createdAt: new Date().toISOString()
  };

  virtualVaultItems.unshift(newItem);

  writeLog("aes_encryption", session.username, ip, ua, `AES-256 encrypted item: '${title}'`, "info", false);

  res.json({
    success: true,
    item: {
      id: newItem.id,
      title: newItem.title,
      category: newItem.category,
      encryptedData: newItem.encryptedData,
      iv: newItem.iv,
      tag: newItem.tag,
      createdAt: newItem.createdAt,
      ownerUsername: session.username
    }
  });
});

// Get Audit Logs (restricted to admins)
app.get("/api/logs", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Unauthorized session" });

  const token = authHeader.replace("Bearer ", "");
  const session = activeSessions.get(token);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Administrative access required" });
  }

  res.json({ success: true, logs: virtualLogs });
});

// Clear Audit Logs (admin)
app.post("/api/logs/clear", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Unauthorized session" });

  const token = authHeader.replace("Bearer ", "");
  const session = activeSessions.get(token);
  if (!session || session.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Administrative access required" });
  }

  virtualLogs.length = 0;
  writeLog("key_rotation", session.username, req.ip || "127.0.0.1", req.headers["user-agent"] || "Unknown", "Admin cleared security logs and performed audit rotation", "info", false);
  res.json({ success: true });
});

// Interactive SQL Injection Simulator Lab Route
app.post("/api/playground/test-sql", (req, res) => {
  const { input, isSecureMode } = req.body;
  const ip = req.ip || "127.0.0.1";
  const ua = req.headers["user-agent"] || "Unknown";

  const isSecure = isSecureMode === true;

  // Let's perform a live WAF check
  const wafCheck = scanForSQLi(input || "");

  // Generate constructed queries for illustration
  const secureQuery = `SELECT * FROM users WHERE username = ?;   [Parameter #1: "${(input || "").replace(/"/g, '\\"')}"]`;
  const vulnerableQuery = `SELECT * FROM users WHERE username = '${input || ""}';`;

  let resultData: any[] = [];
  let isBlocked = false;

  // If Secure Mode is enabled:
  if (isSecure) {
    // If SQLi pattern detected in secure mode:
    // WAF intercepts it first!
    if (wafCheck.isSqli) {
      isBlocked = true;
      writeLog("sqli_blocked", "playground_lab", ip, ua, `WAF BLOCKED SQLi attempt in SECURE play mode: ${input}`, "critical", true);
    } else {
      // Prepared statement execution:
      // Search mock database matching exact user name strictly
      const found = virtualUsers.find(u => u.username.toLowerCase() === (input || "").toLowerCase().trim());
      if (found) {
        resultData = [{
          id: found.id,
          username: found.username,
          role: found.role,
          email: found.email,
          secretCode: found.secretCode
        }];
      }
    }
  } else {
    // VULNERABLE MODE (No parameters, dynamic string construction, and NO WAF block)
    writeLog("sqli_allowed_vulnerable", "playground_lab", ip, ua, `Vulnerable mode query executed with input: ${input}`, wafCheck.isSqli ? "critical" : "warning", false);

    const lowercaseInput = (input || "").toLowerCase().trim();

    // Simulating vulnerability execution!
    // 1. Tautology (e.g. `' OR '1'='1` or `' OR 1=1 --` or `or 1=1`)
    if (
      lowercaseInput.includes("' or '1'='1") || 
      lowercaseInput.includes("or 1=1") || 
      lowercaseInput.includes("' or 1=1") || 
      lowercaseInput.includes("' or ''='") ||
      lowercaseInput.includes("or 'a'='a") ||
      lowercaseInput.includes("' or true") ||
      lowercaseInput.includes("' or 1")
    ) {
      // Dump entire users database! (Highly realistic SQLi demonstration!)
      resultData = virtualUsers.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        email: u.email,
        secretCode: u.secretCode,
        masterPasswordHash: u.masterPasswordHash // Dump secret hashes!
      }));
    } 
    // 2. Union Select (e.g. `' UNION SELECT null, username, secretCode...`)
    else if (lowercaseInput.includes("union") && lowercaseInput.includes("select")) {
      // Combine with mock table structures
      resultData = [
        ...virtualUsers.map(u => ({ id: u.id, username: u.username, role: u.role })),
        { id: "exploit-9", username: "DUMPED_DB_VERSION", role: "MySQL 8.0.31-Enterprise" },
        { id: "exploit-10", username: "DUMPED_AES_MASTER_KEY_SALT", role: MASTER_KEY_SALT },
        { id: "exploit-11", username: "DUMPED_SESSION_TOKENS", role: "SV-SESSION-9a8fbc781c..." }
      ];
    }
    // 3. Normal Search
    else {
      const found = virtualUsers.find(u => u.username.toLowerCase() === lowercaseInput);
      if (found) {
        resultData = [{
          id: found.id,
          username: found.username,
          role: found.role,
          email: found.email,
          secretCode: found.secretCode
        }];
      }
    }
  }

  res.json({
    success: true,
    isBlocked,
    isSqliPattern: wafCheck.isSqli,
    detectedPatterns: wafCheck.matchedPatterns,
    vulnerableQuery,
    secureQuery,
    vulnerableResult: !isSecure ? resultData : "Execution Bypassed",
    secureResult: isSecure && !isBlocked ? resultData : isBlocked ? "BLOCKED BY WAF" : []
  });
});

// Interactive AI Security Analyst Companion Route (Gemini Integration)
app.post("/api/security-advisor/analyze", async (req, res) => {
  const { logRecord } = req.body;

  if (!logRecord) {
    return res.status(400).json({ error: "Missing log details to analyze." });
  }

  try {
    const systemPrompt = `You are an elite Incident Responder and Lead Cyber Security Analyst at SecureVault.
Your job is to analyze security events, explain the underlying threat vectors, grade threat levels, and provide action-oriented, professional mitigation guides.
Output in structured, clean Markdown. Do NOT output HTML. Provide realistic, accurate analyses. Keep the advice tailored, clear, and scannable.`;

    const prompt = `Please analyze the following security alert log record generated by our server audit engine:
- Event ID: ${logRecord.id}
- Event Type: ${logRecord.eventType}
- Associated User: ${logRecord.username}
- Client IP Address: ${logRecord.ipAddress}
- User Agent: ${logRecord.userAgent}
- Log Payload/Metadata: ${logRecord.payload}
- Gravity/Severity Level: ${logRecord.severity}
- Intercepted & Blocked by WAF: ${logRecord.isBlocked ? 'YES' : 'NO'}
- Alert Log Timestamp: ${logRecord.timestamp}

Provide:
1. **Threat Assessment**: Interpret the attack vector or event nature in detail.
2. **Exploit Vector Explanation**: How does this vulnerability function conceptually? Why is it dangerous if left unpatched?
3. **WAF Action Review**: Critique whether the firewall acted correctly or if further policies are required.
4. **Actionable Remediation Checklist**: Provide explicit 2-3 code-level or system-level recommendations to safeguard against this type of threat.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    res.json({ success: true, analysis: response.text });
  } catch (err: any) {
    console.error("Gemini API error during secure log analysis:", err);
    res.status(500).json({ 
      error: "Could not retrieve assessment from AI Security Advisor.",
      details: err.message || "Ensure GEMINI_API_KEY is configured in Settings."
    });
  }
});

// Setup Vite Dev server or Serve compiled files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite Dev Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware (Development mode)");
  } else {
    // Serve Static React bundle from dist folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled React bundle (Production mode)");
  }

  const listenOnPort = (port: number) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`[SecureVault Full-Stack] Server actively running on http://0.0.0.0:${port}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && port < 3010) {
        console.warn(`Port ${port} is busy, trying ${port + 1}...`);
        server.close(() => listenOnPort(port + 1));
      } else {
        throw error;
      }
    });
  };

  listenOnPort(DEFAULT_PORT);
}

startServer();
