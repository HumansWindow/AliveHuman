# GitHub Workflow for AliveHuman Project

## Introduction

This document describes the GitHub workflow for the AliveHuman project, including repository structure, branch strategies, code review processes, and automation using GitHub Actions.

## Repository Structure

The AliveHuman project is organized as a monorepo hosted at [https://github.com/HumansWindow/AliveHuman](https://github.com/HumansWindow/AliveHuman). The repository contains multiple packages with shared dependencies, all managed through Yarn Workspaces.

### Key Components

- `.github/` - Contains GitHub configuration files
  - `workflows/` - CI/CD pipeline definitions
  - `ISSUE_TEMPLATE/` - Templates for bug reports and feature requests
  - `PULL_REQUEST_TEMPLATE.md` - Standard PR template
  - `CODEOWNERS` - Code ownership assignments
  - `dependabot.yml` - Automated dependency updates
  - `settings.yml` - Repository settings including branch protection

## Branch Strategy

We follow a modified GitFlow workflow with two primary branches:

- `main` - Production-ready code
- `develop` - Integration branch for features and bugfixes

### Branch Types

- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation branches

## Getting Started

### 1. Clone the Repository

```bash
# HTTPS
git clone https://github.com/HumansWindow/AliveHuman.git

# SSH (recommended)
git clone git@github.com:HumansWindow/AliveHuman.git
```

### 2. Set Up SSH Authentication

1. Generate an SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Start the SSH agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. Add the key to your GitHub account:
   - Copy the output of: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the key and save

### 3. Configure Git

```bash
git config user.name "Your Name"
git config user.email "your_email@example.com"
```

## Day-to-Day Workflow

### Using the GitHub Helper Script

The project includes a helper script to streamline GitHub operations. The script is located at `scripts/github.sh`.

```bash
# Show help
./scripts/github.sh help

# Set up Git repository
./scripts/github.sh setup

# Create a feature branch
./scripts/github.sh feature feature-name

# Create a bugfix branch
./scripts/github.sh bugfix bug-name

# Create a pull request
./scripts/github.sh pr branch-name "PR Title"

# Update your branch with latest from develop
./scripts/github.sh update
```

### Manual Workflow

#### Starting a New Feature

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "feat(component): add new feature"

# Push to GitHub
git push -u origin feature/my-new-feature
```

#### Creating a Pull Request

1. Push your branch to GitHub
2. Go to the repository on GitHub
3. Click "New pull request"
4. Select `develop` as the base branch and your feature branch as the compare branch
5. Fill in the pull request template
6. Assign reviewers based on the CODEOWNERS file

## Code Reviews

### Guidelines for Reviewers

1. Check for code quality and adherence to project standards
2. Verify that tests are included and passing
3. Ensure documentation is updated if necessary
4. Look for security issues and performance concerns

### Guidelines for Authors

1. Keep PRs small and focused on a single change
2. Include screenshots or videos for UI changes
3. Link to related issues using keywords (fixes, closes, resolves)
4. Respond to review comments promptly

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The workflows are defined in `.github/workflows/`.

### CI Workflow

The CI workflow (`ci.yml`) runs automatically on:
- Pushes to `main` and `develop` branches
- All pull requests to `main` and `develop`

It includes the following jobs:
1. **Lint** - Code style checking
2. **Test** - Unit and integration tests
3. **Build** - Verifies the build process

## Branch Protection Rules

Both `main` and `develop` branches are protected with the following rules:

- Pull request required before merging
- At least one approval required
- Status checks must pass
- CODEOWNERS must review files they own
- Linear history required (no merge commits)

## Team Structure and CODEOWNERS

The project is organized into several teams with specific responsibilities:

- **Core Team** (@AliveHuman/core-team) - Overall project oversight
- **Backend Team** (@AliveHuman/backend-team) - Backend implementation
- **Frontend Team** (@AliveHuman/frontend-team) - Frontend implementation
- **Admin Team** (@AliveHuman/admin-team) - Admin dashboard
- **Mobile Team** (@AliveHuman/mobile-team) - Mobile application
- **DevOps Team** (@AliveHuman/devops-team) - Infrastructure and CI/CD

### CODEOWNERS Assignment

The CODEOWNERS file maps directories to responsible teams. When creating a PR, reviewers are automatically assigned based on which files are changed.

## Common Issues and Solutions

### Authentication Problems

If you're having issues with GitHub authentication:

1. Check your SSH key is added to GitHub
2. Verify SSH agent is running: `ssh-add -l`
3. Test connection: `ssh -T git@github.com`

### Permission Denied Errors

If you get "Permission denied" errors when pushing:

1. Verify you're a member of the required team
2. Confirm you're using SSH, not HTTPS
3. Check that you have write permissions to the repository

### Conflicts When Updating Branch

If you get conflicts when updating your branch:

1. Stash your changes: `git stash`
2. Pull the latest: `git pull origin develop`
3. Apply your stashed changes: `git stash pop`
4. Resolve conflicts and commit

## Best Practices

1. Commit often with clear, descriptive messages
2. Keep branches short-lived and focused
3. Regularly sync with the develop branch
4. Use conventional commit messages for clarity
5. Document API changes and significant implementation details
6. Include tests for new features and bug fixes

## Additional Resources

- [GitHub Documentation](https://docs.github.com/en)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
