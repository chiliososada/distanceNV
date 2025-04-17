export interface UserProfile {
  id: string;
  type: 'person' | 'business';
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
  followersCount: number;
  followingCount: number;
  topicsCount: number;
  likesCount?: number; // Total likes received on topics
  lastActiveAt?: string;
  
  // Business specific fields
  businessName?: string;
  businessCategory?: string;
  businessHours?: string;
  businessPhone?: string;
  businessWebsite?: string;
  viewCount?: number; // For businesses
}

// Add User type alias for backward compatibility
export type User = UserProfile;

export interface NearbyUser {
  user: UserProfile;
  distance: number;
  lastTopic?: {
    id: string;
    title: string;
    createdAt: string;
    distance?: number;
  };
}