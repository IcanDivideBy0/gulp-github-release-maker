'use strict';

var _ = require('lodash');
var gulp = require('gulp');
var githubRelease = require('./lib');

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

gulp.task('release:do', function (done) {
  var type = _.find(['patch', 'minor', 'major'], function (releaseType) {
    return ~process.argv.indexOf('--' + releaseType);
  });

  if (!type) return done('You must specify a release type (--patch|--minor|--major)');

  githubRelease({ type: type }, done);
});
