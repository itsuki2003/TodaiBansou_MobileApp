import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthResult {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'teacher' | 'parent';
  };
  error?: string;
}

/**
 * APIルートでの認証チェック
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false, error: 'Authorization header missing' };
    }

    const token = authHeader.replace('Bearer ', '');

    // JWTトークンを検証
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return { isAuthenticated: false, error: 'Invalid token' };
    }

    // ユーザーの役割を確認
    const userRole = await getUserRole(user.id);
    if (!userRole) {
      return { isAuthenticated: false, error: 'User role not found' };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: userRole,
      },
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return { isAuthenticated: false, error: 'Authentication failed' };
  }
}

/**
 * ユーザーの役割を取得
 */
async function getUserRole(userId: string): Promise<'admin' | 'teacher' | 'parent' | null> {
  // 管理者チェック
  const { data: adminData } = await supabaseAdmin
    .from('administrators')
    .select('id')
    .eq('user_id', userId)
    .eq('account_status', '有効')
    .single();

  if (adminData) return 'admin';

  // 講師チェック
  const { data: teacherData } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .eq('account_status', '有効')
    .single();

  if (teacherData) return 'teacher';

  // 保護者チェック（studentsテーブルからuser_idで検索）
  const { data: studentData } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (studentData && studentData.length > 0) return 'parent';

  return null;
}

/**
 * 権限チェック
 */
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}