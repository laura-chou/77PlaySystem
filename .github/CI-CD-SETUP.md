# Simple GitHub CI/CD Setup

This repository includes a minimal CI/CD pipeline using GitHub Actions for building your Next.js application.

## 🚀 Quick Start

1. **Push your code** to the `77-play-site` branch
2. **Check the Actions tab** to see build status
3. **Run locally** after successful build: `npm run start`

## 📁 Workflow File

### Build Workflow (`action.yml`)
- **Triggers**: Push to `77-play-site` branch, Pull Requests to `77-play-site`
- **What it does**:
  - Installs dependencies
  - Builds your Next.js app
  - Prepares for localhost deployment

## 🔧 How It Works

### Build Process
1. **Checkout code** from your repository
2. **Setup Node.js 18** with npm caching
3. **Install dependencies** with `npm ci`
4. **Build application** with `npm run build`
5. **Set environment** for localhost (`http://localhost:3000`)

### After Build
- Build artifacts are created in `.next/` folder
- Ready to run locally with `npm run start`
- Application will be available at `http://localhost:3000`

## 🛠️ Usage

### Running Locally After Build
```bash
# After a successful GitHub Actions build
npm run start
```

### Manual Build (if needed)
```bash
# Build locally
npm run build

# Start the application
npm run start
```

## 📊 Monitoring

- **Actions Tab**: View build status and logs
- **Green checkmark**: Build successful
- **Red X**: Build failed (check logs for details)

## 🐛 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check Node.js version (should be 18)
   - Run `npm run build` locally to test
   - Check for TypeScript errors

2. **Dependencies Issues**:
   - Run `npm ci` locally
   - Check `package.json` for missing dependencies

3. **TypeScript Errors**:
   - Run `npx tsc --noEmit` locally
   - Fix type errors before pushing

### Debug Steps

1. Check the Actions tab for detailed logs
2. Test locally with the same commands
3. Verify your code compiles without errors

## 🔄 Workflow Details

The workflow runs these steps:
```yaml
- Checkout code
- Setup Node.js 18
- Install dependencies (npm ci)
- Build application (npm run build)
- Confirm build success
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Build Documentation](https://nextjs.org/docs/api-reference/next.config.js/introduction)
- [Node.js Version Management](https://nodejs.org/en/download/)

---

This is a simple build-only workflow. No complex deployment or secrets needed!
