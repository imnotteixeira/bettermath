module.exports = {
    "branches": ["main"],
    "plugins": [
        ["@semantic-release/commit-analyzer", {
            "releaseRules": [
                { "type": "docs", "release": "minor" }
            ]
        }],
        ["@semantic-release/release-notes-generator", {
            "presetConfig": {
                "types": [
                    { "type": "feat", "section": "Features" },
                    { "type": "fix", "section": "Bug Fixes" },
                    { "type": "perf", "section": "Performance Improvements" },
                    { "type": "revert", "section": "Reverts" },
                    { "type": "docs", "section": "Documentation" },
                    { "type": "test", "section": "Tests" },
                    { "type": "style", "section": "Styles", "hidden": true },
                    { "type": "chore", "section": "Miscellaneous Chores", "hidden": true },
                    { "type": "refactor", "section": "Code Refactoring", "hidden": true },
                    { "type": "build", "section": "Build System", "hidden": true },
                    { "type": "ci", "section": "Continuous Integration", "hidden": true },
                ]
            }
        }],
        "@semantic-release/npm",
        ["@semantic-release/git", {
            "assets": ["package.json"],
            "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }],
        "@semantic-release/github"
    ]
}