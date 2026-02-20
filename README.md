# alternative-importers

## Deployment Steps

To publish a new version of this package, follow these steps:

1. **Update package version** (Create a new PR for this)
   - Update the version in `package.json`
   - Create a pull request with the version bump

2. **Build the package**
   ```bash
   npm run build
   ```

3. **Publish to npm** (You need organization access for this)
   ```bash
   npm publish --access public
   ```

4. **Update package version in @requestly/requestly**
   - Update the dependency version in the main Requestly repository
