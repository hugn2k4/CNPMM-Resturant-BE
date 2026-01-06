# Restaurant Customer API

> RESTful API for restaurant customer application built with Express.js and Sequelize.

[![Express](https://img.shields.io/badge/Express-5.1-green.svg)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37-blue.svg)](https://sequelize.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)

## Features

- 🔐 JWT Authentication
- 🍕 Browse Products & Menu
- 🛒 Shopping Cart Management
- 📦 Order Placement & Tracking
- ❤️ Wishlist/Favorites
- 👤 User Profile Management
- 🎫 Voucher System
- ⭐ Product Reviews & Ratings
- 🔔 Notifications
- 💬 Customer Support Chat

## Tech Stack

**Framework:** Express.js 5.1  
**Language:** JavaScript (ES Modules)  
**Database:** MySQL 8.0  
**ORM:** Sequelize 6.37  
**Authentication:** JWT + bcryptjs  
**Security:** Helmet, CORS, Rate Limiting  
**Validation:** express-validator  

## Prerequisites

- Node.js >= 18.x
- MySQL >= 8.0
- npm or yarn

## Getting Started

```bash
# Clone repository
git clone <repository-url>
cd CNPMM-Resturant-BE

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Create database
mysql -u root -p -e "CREATE DATABASE restaurant_customer"

# Run migrations
npx sequelize-cli db:migrate

# Seed database (optional)
npx sequelize-cli db:seed:all

# Start server
npm run dev
```

## Environment Variables

```env
PORT=8000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restaurant_customer
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email
```

### Products
```
GET    /api/products
GET    /api/products/:id
GET    /api/products/category/:id
GET    /api/products/search
GET    /api/categories
```

### Cart
```
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update/:id
DELETE /api/cart/remove/:id
DELETE /api/cart/clear
```

### Orders
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders/create
POST   /api/orders/:id/cancel
GET    /api/orders/:id/track
POST   /api/orders/:id/review
```

### Favorites
```
GET    /api/favorites
POST   /api/favorites/add
DELETE /api/favorites/remove/:id
```

### Profile
```
GET    /api/profile
PUT    /api/profile/update
PUT    /api/profile/change-password
POST   /api/profile/avatar
GET    /api/profile/addresses
POST   /api/profile/addresses
```

### Vouchers
```
GET    /api/vouchers
POST   /api/vouchers/apply
GET    /api/vouchers/my-vouchers
```

### Reviews
```
GET    /api/reviews/product/:id
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

## Project Structure

```
src/
├── config/         # Database configuration
├── models/         # Sequelize models
├── controller/     # Route controllers
├── services/       # Business logic
├── routes/         # API routes
├── middlewares/    # Express middlewares
├── views/          # Email templates (EJS)
├── utils/          # Utility functions
└── index.js        # App entry point
```

## Database Models

- User (Customer)
- Product
- Category
- Order & OrderItem
- Cart & CartItem
- Favorite
- Review
- Voucher
- Notification
- Address

## Authentication

Protected routes require JWT token:

```
Authorization: Bearer <token>
```

## Security

- Helmet.js for security headers
- CORS protection
- Rate limiting (100 requests/minute)
- Password hashing with bcryptjs
- Input validation
- SQL injection protection via Sequelize

## Response Format

### Success
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Scripts

```bash
npm start         # Start server
npm run dev       # Start with nodemon
```

## Sequelize CLI

```bash
# Create model
npx sequelize-cli model:generate --name ModelName --attributes field:type

# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npx sequelize-cli db:migrate

# Seed database
npx sequelize-cli db:seed:all
```

## License

ISC

## Team

Developed by CNPMM Team
