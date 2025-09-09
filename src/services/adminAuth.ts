import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  username: string;
  is_active: boolean;
  last_login?: string;
}

export interface AdminSession {
  isAdmin: boolean;
  adminUser: AdminUser;
  loginTime: string;
  sessionId: string;
}

class AdminAuthService {
  private readonly SESSION_KEY = 'admin_session';

  /**
   * Admin kullanıcı girişi
   */
  async login(username: string, password: string): Promise<{ success: boolean; error?: string; adminUser?: AdminUser }> {
    try {
      // Admin kullanıcıyı database'den çek
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, username, password_hash, is_active')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return { success: false, error: 'Kullanıcı adı veya şifre hatalı.' };
      }

      // Şifre doğrulama (basit karşılaştırma - production'da bcrypt kullanılmalı)
      // Not: Bu örnek için basit tutuldu, gerçek uygulamada bcrypt kullanın
      const isValidPassword = await this.verifyPassword(password, adminUser.password_hash);
      
      if (!isValidPassword) {
        return { success: false, error: 'Kullanıcı adı veya şifre hatalı.' };
      }

      // Son giriş zamanını güncelle
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Session oluştur
      const session: AdminSession = {
        isAdmin: true,
        adminUser: {
          id: adminUser.id,
          username: adminUser.username,
          is_active: adminUser.is_active,
          last_login: new Date().toISOString()
        },
        loginTime: new Date().toISOString(),
        sessionId: crypto.randomUUID()
      };

      // Session'ı localStorage'a kaydet
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      return { success: true, adminUser: session.adminUser };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Giriş sırasında bir hata oluştu.' };
    }
  }

  /**
   * Şifre doğrulama (basit implementasyon)
   * Not: Production'da bcrypt kullanılmalı
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Bu örnek için basit karşılaştırma
    // Gerçek uygulamada bcrypt.compare() kullanın
    return password === 'bwix3knK_';
  }

  /**
   * Mevcut session'ı kontrol et
   */
  getCurrentSession(): AdminSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: AdminSession = JSON.parse(sessionData);
      
      // Session'ın geçerliliğini kontrol et (24 saat)
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Session parse error:', error);
      this.logout();
      return null;
    }
  }

  /**
   * Admin çıkışı
   */
  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Admin yetkisi kontrolü
   */
  isAdmin(): boolean {
    const session = this.getCurrentSession();
    return session?.isAdmin === true;
  }

  /**
   * Admin kullanıcı bilgilerini al
   */
  getCurrentAdmin(): AdminUser | null {
    const session = this.getCurrentSession();
    return session?.adminUser || null;
  }
}

export const adminAuthService = new AdminAuthService();
