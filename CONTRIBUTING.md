# Contributing to the Aleph Indexer Framework
Welcome to the Aleph Indexer Framework monorepo! We appreciate your interest in contributing to our open-source project. This guide will walk you through the process of releasing new versions using lerna version, adding a Git tag, and pushing it to your branch (and merging the branch into a pull request if it's not the main branch).

## Prerequisites
Before you can release new versions, please ensure that you have the following prerequisites:
- [Node.js](https://nodejs.org) installed on your machine.
- [Lerna](https://lerna.js.org/) installed globally. You can install it by running `npm install -g lerna`.

## Releasing New Versions
To release a new version of the monorepo, follow these steps:

1. Clone the repository to your local machine:
```shell
git clone https://github.com/aleph-im/aleph-indexer-framework.git
```
2. Change into the project's directory:
```shell
cd aleph-indexer-framework
```
3. Install the dependencies:
```shell
npm install
```
4. Make any necessary changes or updates to the codebase.
5. Use `lerna version` command to create a new version for the packages in the monorepo. Lerna will guide you through the versioning process:
```shell
lerna version
```
6. Lerna will prompt you to select the new version number. Choose the appropriate version according to [semantic versioning](https://semver.org/) principles.
7. Lerna will automatically update the version numbers in the `package.json` files of the affected packages, create a new Git commit, and tag the commit with the chosen version number.

## Tagging and Pushing to Branch
Once you have created the new version with lerna version, you need to push the Git tag to your branch. Follow these steps:

1. Push the Git tags to your branch:
```shell
git push --tags
```
2. Push the updated commit to your branch:
```shell
git push
```

## Merging Branch into Pull Request
If you are working on a branch other than the main branch and need to merge your changes into a pull request, follow these steps:

1. Create a pull request from your branch to the main branch.
2. Ensure that your pull request has been reviewed and approved.
3. Once approved, merge the pull request into the main branch.
4. After the pull request is merged, the updated code and new version will be available in the main branch.

Thank you for contributing to the Aleph Indexer Framework! We appreciate your efforts and look forward to your continued support. Happy coding!