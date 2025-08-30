# Recovery+ 🏥

A comprehensive React Native/Expo app for physical therapy and injury recovery, featuring AI-powered exercise recommendations, progress tracking, and personalized recovery plans.

## 🚀 Features

- **🤖 AI-Powered Chat**: Get personalized exercise recommendations
- **📱 Cross-Platform**: iOS and Android support via Expo
- **📊 Progress Tracking**: Monitor your recovery journey
- **🎯 Personalized Plans**: Adaptive exercise programs
- **💬 Interactive Questionnaires**: Comprehensive assessment system
- **🔐 User Authentication**: Secure user accounts via Supabase
- **💳 Subscription Management**: Premium features and payment integration
- **📹 Exercise Videos**: High-quality instructional content
- **📈 Analytics**: Detailed feedback and adaptation insights

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: OpenAI GPT integration
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **Styling**: NativeWind (Tailwind CSS)
- **Video**: YouTube integration
- **Payments**: Subscription service integration
- **Development**: TypeScript, ESLint, Prettier

## 📦 Project Structure

```
recovery-plus/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── chat/           # Chat-related components
│   │   ├── common/         # Common components
│   │   ├── feedback/       # Feedback and analytics
│   │   ├── questionnaire/  # Assessment system
│   │   ├── subscription/   # Payment components
│   │   └── ui/            # Base UI components
│   ├── screens/            # App screens
│   │   ├── auth/          # Authentication screens
│   │   ├── chat/          # Chat interface
│   │   ├── exercises/     # Exercise screens
│   │   ├── onboarding/    # User onboarding
│   │   └── settings/      # Settings and profile
│   ├── services/          # API and external services
│   ├── navigation/        # App navigation setup
│   ├── store/            # State management
│   ├── types/            # TypeScript definitions
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── assets/               # Images and static files
└── ios/                 # iOS-specific files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Samgith2025/recovery-plus.git
   cd recovery-plus
   ```

2. **Install dependencies**
   ```bash
   cd recovery-plus
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## 🔧 Development Workflow

### Daily Development
```bash
# Quick save and push
git sync

# Custom commit message
git quick "Add new feature"

# Load git helpers
source ../git-helpers.sh
gsync  # Quick sync
```

### Running the App
```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

### Code Quality
```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test
```

## 📱 Key Features

### 🤖 AI Chat System
- Personalized exercise recommendations
- Progress-based adaptations
- Natural language interaction
- Exercise form guidance

### 📊 Assessment Engine
- Comprehensive questionnaire system
- Body area pain mapping
- Demographic considerations
- Progress tracking metrics

### 🎯 Exercise Management
- Adaptive difficulty progression
- Video demonstrations
- Timer and rep tracking
- Form feedback collection

### 💳 Subscription System
- Premium feature gates
- Payment processing
- Subscription status management
- Trial period handling

## 🔐 Environment Setup

Required environment variables:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
# Add other required keys...
```

## 📈 Current Status

✅ Core architecture implemented
✅ Authentication system
✅ Questionnaire engine
✅ Chat interface
✅ Exercise components
✅ Subscription management
🔄 Active development
🔄 Testing and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 Email: support@recoveryplus.app
- 🐛 Issues: [GitHub Issues](https://github.com/Samgith2025/recovery-plus/issues)
- 📚 Documentation: [Wiki](https://github.com/Samgith2025/recovery-plus/wiki)

## 🚀 Roadmap

- [ ] Advanced AI exercise form analysis
- [ ] Wearable device integration
- [ ] Social features and community
- [ ] Multi-language support
- [ ] Offline mode capabilities
- [ ] Advanced analytics dashboard

---

Built with ❤️ for better recovery outcomes
