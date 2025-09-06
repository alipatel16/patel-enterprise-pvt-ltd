# Showroom Management System

A comprehensive React-based showroom management system for electronics and furniture businesses. This application provides separate data management for electronics and furniture showrooms with role-based access control.

## 🚀 Features

### Core Functionality
- **Dual Business Support**: Separate data management for Electronics and Furniture showrooms
- **Role-Based Access**: Admin and Employee roles with different permissions
- **Customer Management**: CRUD operations with customer types (Wholesaler/Retailer) and categories (Individual/Firm/School)
- **Employee Management**: Full employee lifecycle management (Admin only)
- **Advanced Sales System**: Invoice creation with GST calculation, EMI management, and delivery tracking
- **Notification System**: EMI due alerts and delivery reminders

### Technical Features
- **React 18** with functional components and hooks
- **Material-UI v5.11.0** for responsive design
- **Firebase Realtime Database** for data storage
- **Context API** for state management
- **Mobile-First Responsive Design**
- **Dynamic GST Calculation** (CGST+SGST for Gujarat, IGST for other states)
- **EMI Payment Scheduling**
- **Search & Filter Capabilities**
- **Pagination Support**

## 🏗️ Architecture

### Data Separation Strategy
The application uses user-type-based data separation:
```
Firebase Database Structure:
├── electronics/
│   ├── customers/
│   ├── employees/
│   ├── sales/
│   └── invoices/
├── furniture/
│   ├── customers/
│   ├── employees/
│   ├── sales/
│   └── invoices/
└── users/
    └── {userId}/
        ├── role: "admin|employee"
        ├── userType: "electronics|furniture"
        └── ...
```

### Component Architecture
- **Shared Components**: Single set of reusable components
- **Context-Driven**: User type determines data source
- **Service Layer**: Clean separation between UI and Firebase
- **Utility Functions**: Shared helpers for validation, formatting, etc.

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase project with Realtime Database enabled

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd showroom-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Realtime Database
   - Enable Authentication (Email/Password)
   - Copy your Firebase config
   - Update `src/services/firebase/config.js` with your Firebase configuration:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     databaseURL: "your-database-url",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

4. **Set up Firebase Database Rules**
   ```json
   {
     "rules": {
       "electronics": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "furniture": {
         ".read": "auth != null", 
         ".write": "auth != null"
       },
       "users": {
         "$uid": {
           ".read": "auth != null && auth.uid == $uid",
           ".write": "auth != null && auth.uid == $uid"
         }
       }
     }
   }
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   The application will open at http://localhost:3000

## 🎯 Usage

### Initial Setup
1. **Create Admin User**: Register the first user with admin privileges
2. **Select Business Type**: Choose between Electronics or Furniture during registration
3. **Add Employees**: (Admin only) Add team members with appropriate roles
4. **Add Customers**: Start adding customer information
5. **Create Invoices**: Begin processing sales with automatic GST calculations

### User Roles

#### Admin Capabilities
- Full CRUD access to all modules
- Employee management
- Delete operations
- Access to all features

#### Employee Capabilities  
- Customer management (CRUD except delete)
- Sales/Invoice management
- View employee information (no CRUD access)
- Limited administrative functions

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Adaptive layout with collapsible navigation
- **Mobile**: Mobile-first design with bottom navigation and FABs

## 🧮 GST Calculation

### Automatic GST Handling
- **Gujarat Customers**: CGST (9%) + SGST (9%) = 18%
- **Other States**: IGST (18%)
- **GST-Free Sales**: Option to exclude GST

### EMI Management
- **Monthly Payment Plans**: Flexible EMI scheduling
- **Automatic Reminders**: Due date notifications
- **Payment Tracking**: Individual EMI payment status

## 🔒 Security Features

### Authentication & Authorization
- Firebase Authentication integration
- Role-based access control
- Protected routes
- Session management

### Data Security
- Firebase security rules
- Input validation
- XSS protection
- Secure API calls

## 🛠️ Development

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components
│   ├── customers/       # Customer-specific components
│   ├── employees/       # Employee-specific components
│   └── sales/           # Sales-specific components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── pages/               # Route components
├── services/            # Firebase and API services
├── styles/              # Global styles and themes
└── utils/               # Utility functions
```

### Key Files
- `src/App.js` - Main application component with routing
- `src/contexts/` - State management contexts
- `src/services/` - Firebase integration and business logic
- `src/utils/` - Helper functions and constants

### Available Scripts
- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 🎨 Theming

### Material-UI Theming
- **Electronics Theme**: Blue primary colors
- **Furniture Theme**: Brown/Orange color scheme
- **Dynamic Theme Switching**: Based on user business type
- **Dark Mode Ready**: Prepared for future dark mode implementation

### Responsive Breakpoints
- **xs**: 0px - 599px (Mobile)
- **sm**: 600px - 959px (Tablet)
- **md**: 960px - 1279px (Desktop)
- **lg**: 1280px - 1919px (Large Desktop)
- **xl**: 1920px+ (Extra Large)

## 📊 Features Breakdown

### Customer Management
- **Customer Types**: Wholesaler, Retailer
- **Categories**: Individual, Firm, School
- **Contact Management**: Phone, email, address
- **GST Information**: Optional GST number storage
- **Search & Filter**: Advanced search capabilities

### Employee Management (Admin Only)
- **Role Assignment**: Various roles (Sales Executive, Manager, etc.)
- **Department Organization**: Sales, Operations, Technical, etc.
- **Personal Information**: Contact details, joining date, salary
- **Performance Tracking**: Service duration calculation

### Sales & Invoice Management
- **Dynamic Invoice Generation**: Automatic invoice numbering
- **Multi-Item Support**: Add multiple items per invoice
- **GST Integration**: Automatic tax calculation
- **Payment Options**: Full payment, EMI, or pending
- **Delivery Tracking**: Immediate, scheduled, or pending delivery
- **Status Management**: Payment and delivery status tracking

### Notification System
- **EMI Reminders**: Overdue EMI notifications
- **Delivery Alerts**: Pending delivery reminders
- **Dashboard Badges**: Visual notification indicators

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_USE_EMULATOR=false
REACT_APP_VERSION=1.0.0
```

### Firebase Emulator (Optional)
For development with Firebase emulators:
```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

Set `REACT_APP_USE_EMULATOR=true` in your `.env` file.

## 📈 Performance Optimizations

- **Code Splitting**: Dynamic imports for route components
- **Memoization**: React.memo for component optimization
- **Lazy Loading**: Pagination for large datasets
- **Context Optimization**: Separate contexts to minimize re-renders
- **Bundle Analysis**: Webpack bundle analyzer integration

## 🧪 Testing

### Testing Strategy
- Unit tests for utility functions
- Integration tests for contexts
- Component testing with React Testing Library
- E2E testing setup ready

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage  # Coverage report
```

## 📋 Browser Support

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions  
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions
- **Mobile**: iOS Safari, Chrome Mobile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review Firebase setup guides

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

## 📝 Changelog

### Version 1.0.0
- Initial release
- Complete customer, employee, and sales management
- Firebase integration
- Mobile-responsive design
- Role-based access control
- GST calculation system
- EMI management
- Notification system

---

**Built with ❤️ using React 18, Material-UI, and Firebase**