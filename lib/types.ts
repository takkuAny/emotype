// Supabaseテーブルの型定義

export interface Database {
  public: {
    Tables: {
      user_twitter_auth: {
        Row: {
          id: string;
          user_id: string;
          twitter_user_id: string;
          twitter_username: string;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          twitter_user_id: string;
          twitter_username: string;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          twitter_user_id?: string;
          twitter_username?: string;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      twitter_posts: {
        Row: {
          id: string;
          user_id: string;
          tweet_id: string;
          text: string;
          created_at: string;
          retweet_count: number;
          like_count: number;
          reply_count: number;
          impression_count: number;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tweet_id: string;
          text: string;
          created_at: string;
          retweet_count?: number;
          like_count?: number;
          reply_count?: number;
          impression_count?: number;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tweet_id?: string;
          text?: string;
          created_at?: string;
          retweet_count?: number;
          like_count?: number;
          reply_count?: number;
          impression_count?: number;
          fetched_at?: string;
        };
      };
    };
  };
}

// API レスポンスの型定義
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TwitterAuthResponse {
  url: string;
}

export interface TwitterSyncResponse {
  success: boolean;
  newPosts: number;
  updatedPosts: number;
  totalPosts: number;
  error?: string;
}

export interface TwitterSyncStatus {
  lastSync: string | null;
  totalPosts: number;
}
