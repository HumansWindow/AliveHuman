# Contributing to AliveHuman

Thank you for your interest in contributing to the AliveHuman project! This document provides guidelines and instructions for contributing to our monorepo.

## Development Workflow

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a new branch** for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b bugfix/issue-description
   ```
4. **Make your changes**
5. **Test your changes** by running the appropriate test commands
   ```bash
   yarn workspace @alive-human/shared test
   yarn workspace @alive-human/backend test
   yarn workspace @alive-human/frontend test
   # etc.
   ```
6. **Commit your changes** with a descriptive commit message
   ```bash
   git commit -m "feat(component): add feature X to component Y"
   ```
7. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** from your fork to the main repository

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Scopes:**
- `shared`: Changes to the shared package
- `backend`: Changes to the backend package
- `frontend`: Changes to the frontend package
- `admin`: Changes to the admin package
- `mobile`: Changes to the mobile package
- `docs`: Changes to documentation

## Code Style

We use ESLint and Prettier for code formatting. Make sure to run linting before submitting a PR:

```bash
yarn lint
```

## Monorepo Structure

Please review the project architecture documentation in the `Doqs/ProjectArchitecure` directory to understand how our monorepo is structured and what belongs where.

## Testing

All new features should include appropriate tests. We aim for at least 80% test coverage for new code.

## Documentation

Update the documentation when necessary, especially when adding new features or making significant changes to existing ones.

## Questions?

If you have any questions about contributing, please open an issue with your question or reach out to the maintainers.

Thank you for contributing to AliveHuman!
