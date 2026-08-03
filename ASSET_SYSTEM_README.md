# NeedNow Asset Management System

A comprehensive AI-powered home inventory management system that tracks everything you own and provides intelligent shopping recommendations.

## 🏠 System Overview

The Asset Management System is designed as a **digital representation of your home**, not a warehouse system. It helps users:

- Track items across different locations in their home
- Get low stock alerts and expiry notifications  
- Receive AI-powered shopping recommendations
- Monitor consumption patterns and usage analytics
- Manage multiple collections (Home, Office, Apartment, etc.)

## 📋 Features Implemented

### Backend (Django REST Framework)

#### 📊 Models
- **AssetCollection**: Logical groupings (Home, Office, etc.)
- **AssetLocation**: Hierarchical locations (Kitchen > Pantry > Shelf)
- **Asset**: Items you own with quantities and metadata
- **AssetTransaction**: Complete audit trail of all changes

#### 🚀 Smart Actions API
Beyond basic CRUD, includes domain-specific actions:

- `POST /assets/{id}/consume/` - Use items and track consumption
- `POST /assets/{id}/restock/` - Add more quantity  
- `POST /assets/{id}/adjust/` - Set exact quantity
- `POST /assets/{id}/move/` - Change location
- `POST /assets/bulk_consume/` - Bulk operations

#### 📈 Analytics & Intelligence
- `GET /dashboard/` - Comprehensive collection overview
- `GET /recommendations/` - AI shopping recommendations
- `GET /analytics/` - Usage patterns and trends

#### 🔧 Business Logic Services
- Collection setup with default locations
- Smart recommendation engine
- Bulk operation handling
- Advanced search and filtering

### Frontend (Next.js + TypeScript)

#### 🎨 Design System Integration
Following the established design.md guidelines:

- **Color Palette**: Core/Cloud/Juice with proper light/dark mode
- **Typography**: Geometric sans serif (matching existing system)
- **Layout**: Bento grid system with rounded cards
- **Components**: Consistent with existing UI patterns

#### 📱 Pages & Components
- **Assets Dashboard** (`/assets`) - Collection overview
- **Collection Detail** (`/assets/[id]`) - Detailed inventory view
- **Multi-view Interface**: Dashboard, Assets, Recommendations
- **Real-time Actions**: Quick consume/restock buttons
- **Smart Filtering**: Search, low stock, expired items

## 🗂️ File Structure

### Backend
```
backend/asset/
├── models.py          # Core data models
├── serializers.py     # API serializers  
├── views.py          # ViewSets and API views
├── services.py       # Business logic layer
├── urls.py           # URL routing
├── admin.py          # Django admin config
└── migrations/       # Database migrations
```

### Frontend
```
frontend/
├── lib/assets.ts              # API client library
├── app/assets/page.tsx        # Main assets page
└── app/assets/[id]/page.tsx   # Collection detail page
```

## 🔗 API Endpoints

### Collections
- `GET /api/assets/collections/` - List collections
- `POST /api/assets/collections/` - Create collection  
- `PATCH /api/assets/collections/{id}/` - Update collection
- `DELETE /api/assets/collections/{id}/` - Delete collection

### Locations  
- `GET /api/assets/locations/` - List locations
- `GET /api/assets/locations/tree/` - Hierarchical tree
- `POST /api/assets/locations/` - Create location

### Assets
- `GET /api/assets/assets/` - List assets (with filters)
- `POST /api/assets/assets/` - Create asset
- `POST /api/assets/assets/{id}/consume/` - Consume quantity
- `POST /api/assets/assets/{id}/restock/` - Add quantity  
- `POST /api/assets/assets/{id}/move/` - Change location
- `POST /api/assets/assets/bulk_consume/` - Bulk operations

### Analytics
- `GET /api/assets/dashboard/?collection={id}` - Dashboard data
- `GET /api/assets/recommendations/?collection={id}` - AI recommendations
- `GET /api/assets/analytics/?collection={id}` - Usage analytics

## 🤖 Smart Features

### AI Recommendations
The system analyzes:
- **Low Stock Items**: Items below threshold
- **Usage Patterns**: Frequently consumed items  
- **Restocking History**: Items not restocked recently
- **Expiry Tracking**: Items expiring soon

### Transaction Tracking
Every action creates a transaction record:
- **Consume**: Using items (-quantity)
- **Add**: Restocking items (+quantity)  
- **Adjust**: Setting exact quantity
- **Move**: Changing location

### Location Hierarchy
Supports nested locations:
```
Home/
├── Kitchen/
│   ├── Pantry/
│   ├── Fridge/
│   └── Freezer/
├── Bathroom/
└── Garage/
```

## 🎯 Usage Examples

### Adding Items
```typescript
// Add milk to fridge
await createAsset({
  collection: "home-collection-id",
  product_id: "milk-product-id", 
  location: "fridge-location-id",
  quantity: 2,
  low_stock_threshold: 1,
  expiry_date: "2024-07-15"
});
```

### Quick Actions
```typescript
// Use 1 milk
await consumeAsset("asset-id", { 
  quantity: 1, 
  note: "Morning coffee" 
});

// Restock 3 milk
await restockAsset("asset-id", { 
  quantity: 3, 
  note: "Weekly grocery run" 
});
```

### Getting Recommendations
```typescript
const recommendations = await getShoppingRecommendations("collection-id");
// Returns items to buy based on usage patterns
```

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```

### Create Your First Collection
1. Visit `/assets`
2. Click "New Collection" 
3. Create "Home" collection
4. Add default locations (Kitchen, Bathroom, etc.)
5. Start adding your items!

## 🔮 Future Enhancements

### Planned Features
- **Barcode Scanning**: Add items by scanning
- **Recipe Integration**: Track ingredients usage
- **Shopping List Generation**: Auto-create lists from recommendations  
- **Expiry Notifications**: Email/push alerts
- **Family Sharing**: Multiple users per collection
- **Mobile App**: Native iOS/Android apps

### AI Improvements
- **Consumption Prediction**: Predict when you'll run out
- **Seasonal Patterns**: Learn seasonal usage patterns
- **Price Tracking**: Find best deals for recommended items
- **Smart Categorization**: Auto-categorize new items

## 🧪 Development Notes

### Key Design Decisions
- **Product References**: Links to existing Product model (no duplication)
- **Hierarchical Locations**: Flexible nested structure
- **Transaction Logging**: Complete audit trail for analytics
- **Service Layer**: Business logic separated from views
- **Type Safety**: Full TypeScript coverage

### Performance Considerations
- **Optimized Queries**: select_related/prefetch_related usage
- **Efficient Filtering**: Database-level filtering vs Python
- **Caching Strategy**: Ready for Redis integration
- **Bulk Operations**: Atomic transactions for consistency

### Security Features
- **User Isolation**: Collections scoped to authenticated users
- **Input Validation**: Comprehensive serializer validation  
- **Transaction Integrity**: Database constraints and checks
- **API Authentication**: Neon Auth JWT integration

This asset management system transforms the concept of home inventory into an intelligent, user-friendly experience that fits naturally into the NeedNow ecosystem.