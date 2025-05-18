#!/bin/bash
# Script to help with GitHub workflow for AliveHuman

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
show_help() {
  echo -e "${BLUE}AliveHuman GitHub Workflow Helper${NC}"
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  setup                  Set up Git repository with proper configuration"
  echo "  feature <name>         Create a new feature branch"
  echo "  bugfix <name>          Create a new bugfix branch"
  echo "  pr <branch> <title>    Create a pull request for a branch"
  echo "  update                 Update current branch with latest from develop"
  echo "  help                   Show this help message"
}

setup_git() {
  echo -e "${BLUE}Setting up Git repository...${NC}"
  
  # Check if .git directory exists
  if [ -d ".git" ]; then
    echo -e "${YELLOW}Git repository already initialized.${NC}"
  else
    echo -e "${GREEN}Initializing Git repository...${NC}"
    git init
  fi
  
  # Check for remote origin
  if git remote | grep -q "origin"; then
    echo -e "${YELLOW}Remote 'origin' already exists.${NC}"
  else
    echo -e "${GREEN}Please enter the GitHub repository URL:${NC}"
    read repo_url
    git remote add origin $repo_url
    echo -e "${GREEN}Added remote 'origin' pointing to $repo_url${NC}"
  fi
  
  # Set up Git hooks
  if [ ! -d ".git/hooks" ]; then
    mkdir -p .git/hooks
  fi
  
  # Create pre-commit hook for linting
  echo '#!/bin/bash
# Pre-commit hook for linting

# Run linting
echo "Running linting..."
yarn lint

# Check the exit status
if [ $? -ne 0 ]; then
  echo "Linting failed. Please fix the issues before committing."
  exit 1
fi

exit 0
' > .git/hooks/pre-commit
  
  chmod +x .git/hooks/pre-commit
  echo -e "${GREEN}Created pre-commit hook for linting.${NC}"
  
  # Configure Git user if not already set
  if [ -z "$(git config user.name)" ]; then
    echo -e "${GREEN}Please enter your name for Git commits:${NC}"
    read git_name
    git config user.name "$git_name"
  fi
  
  if [ -z "$(git config user.email)" ]; then
    echo -e "${GREEN}Please enter your email for Git commits:${NC}"
    read git_email
    git config user.email "$git_email"
  fi
  
  echo -e "${GREEN}Git repository setup complete!${NC}"
}

create_feature_branch() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Feature name is required.${NC}"
    echo "Usage: $0 feature <name>"
    exit 1
  fi
  
  feature_name=$1
  branch_name="feature/${feature_name}"
  
  echo -e "${BLUE}Creating feature branch: ${branch_name}${NC}"
  
  # Make sure we have the latest develop branch
  git fetch origin develop
  
  # Create branch from develop
  git checkout -b $branch_name origin/develop || git checkout -b $branch_name
  
  echo -e "${GREEN}Created and switched to branch: ${branch_name}${NC}"
  echo -e "${YELLOW}Make your changes and then commit them:${NC}"
  echo -e "git add ."
  echo -e "git commit -m \"feat(<scope>): your feature description\""
  echo -e "git push -u origin ${branch_name}"
}

create_bugfix_branch() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Bugfix name is required.${NC}"
    echo "Usage: $0 bugfix <name>"
    exit 1
  fi
  
  bugfix_name=$1
  branch_name="bugfix/${bugfix_name}"
  
  echo -e "${BLUE}Creating bugfix branch: ${branch_name}${NC}"
  
  # Make sure we have the latest develop branch
  git fetch origin develop
  
  # Create branch from develop
  git checkout -b $branch_name origin/develop || git checkout -b $branch_name
  
  echo -e "${GREEN}Created and switched to branch: ${branch_name}${NC}"
  echo -e "${YELLOW}Make your changes and then commit them:${NC}"
  echo -e "git add ."
  echo -e "git commit -m \"fix(<scope>): your bugfix description\""
  echo -e "git push -u origin ${branch_name}"
}

create_pull_request() {
  if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Both branch name and PR title are required.${NC}"
    echo "Usage: $0 pr <branch> <title>"
    exit 1
  fi
  
  branch_name=$1
  pr_title=$2
  
  echo -e "${BLUE}Creating pull request for branch: ${branch_name}${NC}"
  
  # Check if gh CLI is installed
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo "Then create a PR manually on GitHub."
    exit 1
  fi
  
  # Make sure the branch is pushed
  git push -u origin $branch_name
  
  # Create the PR
  gh pr create --base develop --head $branch_name --title "$pr_title" --body "Please review the changes in this pull request."
  
  echo -e "${GREEN}Pull request created successfully!${NC}"
}

update_branch() {
  current_branch=$(git branch --show-current)
  
  echo -e "${BLUE}Updating branch: ${current_branch} with latest from develop${NC}"
  
  # Fetch the latest develop branch
  git fetch origin develop
  
  # Merge develop into current branch
  git merge origin/develop
  
  echo -e "${GREEN}Branch updated successfully!${NC}"
}

# Main script
case "$1" in
  setup)
    setup_git
    ;;
  feature)
    create_feature_branch "$2"
    ;;
  bugfix)
    create_bugfix_branch "$2"
    ;;
  pr)
    create_pull_request "$2" "$3"
    ;;
  update)
    update_branch
    ;;
  help|*)
    show_help
    ;;
esac

exit 0
