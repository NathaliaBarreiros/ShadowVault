# ShadowVault - Claude Local Documentation

This file contains project-specific instructions and context for Claude Code sessions.

## 🏗 Project Overview

**ShadowVault** is a privacy-first password manager built for the ETHGlobal NY hackathon with:
- **Frontend**: Next.js 14 App Router with TypeScript and Privy Authentication
- **Smart Contracts**: Hardhat project on Zircuit Garfield Testnet
- **Blockchain**: Zircuit network (Advanced ZK-optimized L2)
- **Security**: Zero-knowledge proofs, encrypted storage, OpenZeppelin standards

## 📁 Project Structure

```
ShadowVault/
├── ShadowVaultApp/          # Next.js frontend application
│   ├── app/                 # App Router pages
│   │   ├── vault/           # Password management UI
│   │   ├── security/        # Security settings
│   │   ├── analytics/       # Usage analytics
│   │   ├── networks/        # Network management
│   │   └── onboarding/      # User onboarding
│   ├── components/          # Reusable React components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/                 # Utility libraries
│   ├── hooks/               # Custom React hooks
│   └── public/              # Static assets
├── ShadowVaultContracts/    # Hardhat smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── typechain-types/     # Generated TypeScript types
├── .gitignore               # Git ignore rules
└── CLAUDE.local.md          # This file
```

## 🔧 Development Workflow

### Frontend (ShadowVaultApp)
```bash
cd ShadowVaultApp
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Smart Contracts (ShadowVaultContracts)
```bash
cd ShadowVaultContracts
npm install          # Install dependencies
npm run build        # Compile contracts
npm run test         # Run tests
npm run deploy:zircuit  # Deploy to Zircuit Garfield Testnet
```

## 🎯 Key Features Implemented

### Smart Contracts
- ✅ **ShadowVault.sol**: Main contract with OpenZeppelin security
- ✅ **Zircuit Garfield Testnet**: Network setup and configuration
- ✅ **Comprehensive Tests**: 16 tests covering all functionality
- ✅ **Deployment Scripts**: Automated deploy with explorer URLs
- ✅ **Live Deployment**: Contract deployed at `0xFfD385c7BC7645846449363825a31435DA6d2095`

### Frontend Features
- ✅ **Modern UI**: shadcn/ui components with dark/light theme
- ✅ **App Router**: Next.js 14 app directory structure
- ✅ **TypeScript**: Full type safety
- ✅ **Privy Authentication**: Multi-method auth (email, SMS, wallet)
- ✅ **Wagmi Integration**: Web3 wallet connectivity
- ✅ **Responsive Design**: Mobile-first approach

## 🔐 Security Considerations

### Smart Contract Security
- **OpenZeppelin Standards**: Ownable, ReentrancyGuard, Pausable
- **Input Validation**: Comprehensive validation for all functions
- **Access Control**: User isolation and owner permissions
- **Gas Optimization**: Efficient storage and operations

### Frontend Security
- **Environment Variables**: Sensitive data in .env files
- **Type Safety**: TypeScript for runtime error prevention
- **Secure Defaults**: Security-first configurations

## 🌐 Network Configuration

### Zircuit Garfield Testnet
- **Chain ID**: 48898
- **RPC URL**: https://garfield-testnet.zircuit.com
- **Explorer**: https://explorer.garfield-testnet.zircuit.com
- **Faucet**: Use Sepolia faucets (Zircuit uses Sepolia ETH)
- **Features**: ZK-optimized, EIP-7702 compatible, Pectra opcodes

### Contract Addresses
```typescript
// Live deployment
const SHADOWVAULT_ADDRESS = "0xFfD385c7BC7645846449363825a31435DA6d2095";
const CHAIN_ID = 48898;
const EXPLORER_URL = "https://explorer.garfield-testnet.zircuit.com/address/0xFfD385c7BC7645846449363825a31435DA6d2095";
```

## 📝 Common Tasks

### Deploy Smart Contracts
1. Configure `.env` in ShadowVaultContracts:
   ```env
   PRIVATE_KEY=your_64_character_private_key
   ZIRCUIT_RPC_URL=https://garfield-testnet.zircuit.com
   REPORT_GAS=false
   ```
2. Deploy: `npm run deploy:zircuit`
3. Interact: `npx hardhat run scripts/interact.ts --network zircuitGarfieldTestnet <contract_address>`
4. Verify: `npx hardhat verify --network zircuitGarfieldTestnet <contract_address> <deployer_address>`

### Frontend Development
1. Start dev server: `npm run dev`
2. Add components: Use shadcn/ui CLI
3. Test responsive: Check mobile/desktop layouts
4. Update contract integration after deployment

### Debugging
- **Smart Contracts**: Use Hardhat console and tests
- **Frontend**: Browser DevTools and Next.js error overlay
- **Network Issues**: Check Zircuit network status
- **Explorer**: https://explorer.garfield-testnet.zircuit.com for transaction debugging

## 🚀 Deployment Status

### Smart Contracts
- [x] Contract developed and tested
- [x] Zircuit Garfield Testnet configuration complete
- [x] Successfully deployed to Zircuit (`0xFfD385c7BC7645846449363825a31435DA6d2095`)
- [x] Live testing and interaction confirmed
- [x] Explorer URLs integrated in deployment scripts

### Frontend
- [x] Core UI components implemented
- [x] App Router structure complete
- [x] Privy authentication integrated
- [x] Wagmi Web3 connectivity configured
- [x] Environment variables updated with contract address
- [ ] Full end-to-end testing (authentication + contract interaction)
- [ ] Production deployment

## 🎨 UI/UX Guidelines

### Design System
- **Theme**: Dark/light mode support
- **Colors**: Consistent color palette
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent spacing scale
- **Components**: shadcn/ui for consistency

### User Experience
- **Onboarding**: Step-by-step user guidance
- **Security**: Clear security indicators
- **Privacy**: Privacy-first messaging
- **Performance**: Fast loading and interactions

## 🔍 Code Quality

### Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Testing**: Comprehensive test coverage

### File Naming
- **Components**: PascalCase (UserProfile.tsx)
- **Utilities**: camelCase (crossChain.ts)
- **Pages**: kebab-case (vault/add/page.tsx)
- **Contracts**: PascalCase (ShadowVault.sol)

## 📚 Resources

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Zircuit Documentation](https://docs.zircuit.com/)
- [Privy Documentation](https://docs.privy.io/)
- [Wagmi Documentation](https://wagmi.sh/)

### Tools
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Privy, Wagmi
- **Smart Contracts**: Hardhat, Solidity, OpenZeppelin
- **Blockchain**: Zircuit Garfield Testnet, Zircuit Explorer
- **Package Manager**: npm (frontend), npm (contracts)

## 🐛 Known Issues

### Current Limitations
- Frontend-contract integration needs end-to-end testing
- Password encryption/decryption flow needs implementation
- User credential management UI needs completion

### Future Enhancements
- Cross-chain support expansion
- Advanced analytics dashboard
- Mobile app development
- Additional security features

## 📞 Support

For development questions:
1. Check this documentation first
2. Review project README files
3. Check official framework documentation
4. Use GitHub issues for bugs

---

**Last Updated**: 2025-08-16
**Project Status**: Active Development
**Hackathon**: ETHGlobal NY