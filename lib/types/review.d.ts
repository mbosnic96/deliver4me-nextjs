export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  loadId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
