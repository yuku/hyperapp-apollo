# Change Log

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

This change log adheres to [keepachangelog.com](http://keepachangelog.com).

## [Unreleased]
### Changed
- Rewrite `<Query/>` as react-apollo.

### Added
- Support `fetchMore` and `notificyNetworkStatusChange`

### Changed
- Remove src directory from npm package.

### Fixed
- Update query result when `variables` prop is changed.

## [0.3.1] - 2018-03-30
### Added
- Add index.mjs to dist files.

### Changed
- Change format of dist/hyperapp-apollo.js from IIFE to UMD.

### Fixed
- Enable to load apollo-utilities as global variable.

## [0.3.0] - 2018-03-30
### Added
- Add hyperapp-apollo.js and hyperapp-apollo.min.js to dist files.
- Enable to use `<Query/>` in a loop.
- Add `mutation()` and `<Mutation/>` component.
- Export `QueryModuleState` and `MutationModuleState` types.
- `<Query/>` is reactive for changing `variables` prop.

### Changed
- Move hyperapp from peerDependencies to dependencies.
- Remove `<apollo-query/>` element from DOM tree.
- `variables` render prop of specifies the variable object the query was called with.

### Fixed
- Make sure `data` and `loading` reflects query state.

## [0.2.0] - 2018-03-29
### Changed
- Replace `graphql()` with `query()` for flexibility.
- Rename `fetching` as `loading`.
- Make `variables` prop of `<Query/>` optional.

## [0.1.0] - 2018-03-28
### Added
- Initial release.

[Unreleased]: https://github.com/yuku-t/hyperapp-apollo/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/yuku-t/hyperapp-apollo/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/yuku-t/hyperapp-apollo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/yuku-t/hyperapp-apollo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yuku-t/hyperapp-apollo/compare/2134207...v0.1.0
