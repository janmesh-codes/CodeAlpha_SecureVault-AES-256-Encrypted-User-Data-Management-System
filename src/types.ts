export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface VaultItem {
  id: string;
  userId: string;
  title: string;
  category: 'credential' | 'api_key' | 'secure_note';
  encryptedData: string; // Base64 ciphertext
  iv: string;            // Initialization Vector (Hex)
  tag?: string;          // GCM Authentication Tag (Hex)
  createdAt: string;
}

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export type SecurityEventType = 
  | 'login_success' 
  | 'login_failed' 
  | 'sqli_blocked' 
  | 'sqli_allowed_vulnerable' 
  | 'unauthorized_access' 
  | 'aes_encryption' 
  | 'aes_decryption'
  | 'key_rotation';

export interface SecurityLog {
  id: string;
  eventType: SecurityEventType;
  username: string;
  ipAddress: string;
  userAgent: string;
  payload: string;
  severity: SecuritySeverity;
  isBlocked: boolean;
  timestamp: string;
}

export interface SqliTestResult {
  rawInput: string;
  isBlocked: boolean;
  isSqliPattern: boolean;
  detectedPatterns: string[];
  vulnerableQuery: string;
  secureQuery: string;
  vulnerableResult: any[] | string;
  secureResult: any[] | string;
}
