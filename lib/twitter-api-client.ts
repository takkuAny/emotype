// フロントエンドからTwitter APIを呼び出すためのクライアント

import { 
  TwitterAuthResponse, 
  TwitterSyncResponse, 
  TwitterSyncStatus,
  ApiResponse 
} from '@/lib/types';

class TwitterApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/twitter';
  }

  /**
   * Twitter連携を開始（OAuth認証URLを取得して遷移）
   */
  async connectTwitter(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('認証URLの取得に失敗しました');
      }

      const data: TwitterAuthResponse = await response.json();
      
      // Twitter認証ページへリダイレクト
      window.location.href = data.url;
    } catch (error) {
      console.error('Twitter連携エラー:', error);
      throw error;
    }
  }

  /**
   * Twitter連携を解除
   */
  async disconnectTwitter(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '連携解除に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Twitter連携解除エラー:', error);
      throw error;
    }
  }

  /**
   * Twitterデータを同期
   */
  async syncTwitterData(): Promise<TwitterSyncResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'データ同期に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Twitterデータ同期エラー:', error);
      throw error;
    }
  }

  /**
   * 同期ステータスを取得
   */
  async getSyncStatus(): Promise<TwitterSyncStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ステータス取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('同期ステータス取得エラー:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const twitterApi = new TwitterApiClient();

// React Hook版
export function useTwitterApi() {
  return {
    connectTwitter: () => twitterApi.connectTwitter(),
    disconnectTwitter: () => twitterApi.disconnectTwitter(),
    syncTwitterData: () => twitterApi.syncTwitterData(),
    getSyncStatus: () => twitterApi.getSyncStatus(),
  };
}