export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: Date
  quickReplies?: string[]
}

export interface CartItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: 'Essential' | 'Optional' | 'Luxury'
  image?: string
}

export interface PantryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: Date
  icon: string
}

export interface GroupMember {
  id: string
  name: string
  avatar: string
}

export interface Group {
  id: string
  name: string
  members: GroupMember[]
  itemCount: number
  totalPrice: number
  image?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  rating: number
  reviews: number
  tags: string[]
  category: string
  image?: string
  inWishlist?: boolean
}
