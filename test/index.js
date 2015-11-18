'use strict';

var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

chai.config.includeStack = true;
chai.use(require('sinon-chai'));

var gutil = require('gulp-util');
var git = require('gulp-git');
var prompt = require('gulp-prompt');
var through = require('through');
var mversion = require('mversion');

describe('Gulp GitHub release maker plugin', function () {
  var githubRelease = require('../lib');

  beforeEach(function () {
    sinon.stub(gutil, 'log');
    sinon.stub(prompt, 'confirm', function () {
      var stream = through().pause().end();
      process.nextTick(stream.resume.bind(stream));
      return stream;
    });

    sinon.stub(mversion, 'get').yields(null, {
      'package.json': '1.0.0'
    });
    sinon.stub(mversion, 'update').yields(null);

    sinon.stub(git, 'exec', function (options, callback) {
      if (options.args === 'describe --abbrev=0 --tags')
        return callback(null, '1.0.0');

      if (options.args === 'log --merges --pretty="* %b | %s" 1.0.0..HEAD')
        return callback(null, [
          '* fix(stuff): some commit message | Merge pull request #12 from whoever/whatever',
          '* fix(stuff): another commit message | Merge pull request #13 from whoever/whatever',
        ].join('\n'));

      if (options.args === 'push')
        return callback(null);

      if (options.args === 'push --tags')
        return callback(null);

      if (options.args === 'config --get remote.origin.url')
        return callback(null, 'git@github.com:IcanDivideBy0/gulp-github-release-maker.git');

      callback(new Error('Unknown git command: ' + options.args));
    });
  });

  afterEach(function () {
    gutil.log.restore();
    prompt.confirm.restore();
    mversion.get.restore();
    mversion.update.restore();
    git.exec.restore();
  });

  describe('#showChangelog', function () {
    it('display merged pull request since last tag', function (done) {
      githubRelease.showChangelog(function (err) {
        if (err) return done(err);

        expect(gutil.log).to.have.been.calledWith([
          'Changelog:',
          '* fix(stuff): some commit message (#12)',
          '* fix(stuff): another commit message (#13)'
        ].join('\n'));
        done();
      });
    });
  });

  describe('#createRelease', function () {
    it('should promt user for confirmation', function (done) {
      githubRelease.createRelease({
        type: 'minor'
      }, function (err) {
        if (err) return done(err);

        expect(prompt.confirm).to.have.been.called.once;
        done();
      });
    });

    it('should bump package.json and commit using mversion', function (done) {
      githubRelease.createRelease({
        type: 'minor'
      }, function (err) {
        if (err) return done(err);

        expect(mversion.update).to.have.been.called.once;
        done();
      });
    });

    it('should push branch', function (done) {
      githubRelease.createRelease({
        type: 'minor'
      }, function (err) {
        if (err) return done(err);

        expect(git.exec).to.have.been.calledWithMatch({
          args: 'push'
        });
        done();
      });
    });

    it('should push tags', function (done) {
      githubRelease.createRelease({
        type: 'minor'
      }, function (err) {
        if (err) return done(err);

        expect(git.exec).to.have.been.calledWithMatch({
          args: 'push --tags'
        });
        done();
      });
    });

    it('should show a link to GitHub release', function (done) {
      githubRelease.createRelease({
        type: 'minor'
      }, function (err) {
        if (err) return done(err);

        expect(gutil.log).to.have.been.calledWith(
          'New tag has been pushed, you can now copy changelog and create the release: ' +
          'https://github.com/IcanDivideBy0/gulp-github-release-maker/releases/new?tag=v1.1.0'
        );
        done();
      });
    });
  });
});
