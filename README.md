# Gulp GitHub release maker

[![Build Status](https://travis-ci.org/IcanDivideBy0/gulp-github-release-maker.svg?branch=master)](https://travis-ci.org/IcanDivideBy0/gulp-github-release-maker)

## Install

```sh
npm i --save-dev gulp-github-release-maker
```

## Usage

Add the following to your `gulpfile.js`:

```js
'use strict';

var gulp = require('gulp');
var githubRelease = require('gulp-github-release-maker');

gulp.task('release:changelog', function (done) {
  githubRelease.showChangelog(done);
});

gulp.task('release:do:patch', function (done) {
  githubRelease.createRelease({ type: 'patch' }, done);
});

gulp.task('release:do:minor', function (done) {
  githubRelease.createRelease({ type: 'minor' }, done);
});

gulp.task('release:do:major', function (done) {
  githubRelease.createRelease({ type: 'major' }, done);
});
```

The `release:changelog` command will show the pull requests merged since your last tag.

The `release:do:*` commands will:
* show the changelog since last tag
* ask a user confirmation before doing anything
* bump your `package.json` according to the `type` option
* commit the change
* create a tag
* push the master
* push tags
