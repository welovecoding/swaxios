workflow "Lint, build and test" {
  on = "push"
  resolves = ["Lint project", "Build project", "Test project"]
}

action "Check for CI skip" {
  uses = "./.github/actions/skip_ci_check"
}

action "Install dependencies" {
  uses = "./.github/actions/node"
  needs = "Check for CI skip"
  runs = "yarn"
}

action "Lint project" {
  uses = "./.github/actions/node"
  needs = "Install dependencies"
  runs = "yarn"
  args = "lint"
}

action "Build project" {
  uses = "./.github/actions/node"
  needs = "Install dependencies"
  runs = "yarn"
  args = "dist"
}

action "Test project" {
  uses = "./.github/actions/node"
  needs = "Install dependencies"
  runs = "yarn"
  args = "test"
}
