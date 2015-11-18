'use strict';

var _ = require('lodash');
var async = require('async');
var gulp = require('gulp');
var gutil = require('gulp-util');
var git = require('gulp-git');
var semver = require('semver');

/**
 * Expose module.
 */

module.exports = {
  showChangelog: showChangelog,
  createRelease: createRelease
};

/**
 * Show changelog.
 */

function showChangelog(prefix, callback) {
  if (_.isFunction(prefix)) {
    callback = prefix;
    prefix = 'Changelog:';
  }

  getChangelog(function (err, merges) {
    if (err) return callback(err);

    gutil.log(merges.reduce(function (acc, merge) {
      return acc + '\n' + merge;
    }, prefix));

    callback();
  });
}

/**
 * Create a release.
 */

function createRelease(options, callback) {
  _.defaults(options, {
    type: 'minor',
    commitMessage: 'Bumps to version %s'
  });

  require('mversion').get(function (err, data) {
    if (err) return callback(err);

    var newVer = semver.inc(data['package.json'], options.type);

    async.series([
      function disclaimer(next) {
        var messageTpl = 'You are about to publish a <%= type %> release with the following changelog:';

        showChangelog(_.template(messageTpl)({
          type: gutil.colors.bold.green(options.type)
        }), next);
      },
      function prompt(next) {
        var promptTpl = 'Are you sure you want to publish the <%= newVer %> release ?';

        gulp.src('')
        .pipe(require('gulp-prompt').confirm({
          message: _.template(promptTpl)({
            newVer: gutil.colors.bold.green('v' + newVer)
          }),
          default: true
        }))
        .on('end', next.bind(null, null))
        .on('error', next);
      },
      function bump(next) {
        require('mversion').update({
          version: options.type,
          commitMessage: options.commitMessage
        }, next);
      },
      function push(next) {
        git.exec({
          args: 'push',
          quiet: true
        }, next);
      },
      function pushTags(next) {
        git.exec({
          args: 'push --tags',
          quiet: true
        }, next);
      },
      function successMessage(next) {
        git.exec({
          args: 'config --get remote.origin.url',
          quiet: true
        }, function (err, origin) {
          if (err) return next(err);

          var message =
            'New tag has been pushed, you can now copy changelog and create the release: <%= url %>';
          gutil.log(_.template(message)({
            url: origin.trim()
              .replace(/^git@github.com:/, 'https://github.com/')
              .replace(/\.git$/, '/releases/new?tag=v' + newVer)
          }));

          next();
        });
      }
    ], callback);
  });

}

/**
 * Get the list of merged pull-requests since last tag.
 */

function getChangelog(callback) {
  async.waterfall([
    function getLatestTag (next) {
      git.exec({
        args: 'describe --abbrev=0 --tags',
        quiet: true
      }, function (err, latestTag) {
        // Err, mostly like there is no tag yet.
        next(null, err ? '' : latestTag);
      });
    },
    function getMerges (latestTag, next) {
      git.exec({
        args: 'log --merges --pretty="* %b | %s" ' + latestTag.trim() + '..HEAD',
        quiet: true
      }, next);
    },
    function formatMerges (merges, next) {
      next(null, merges.trim().split('\n').map(function (merge) {
        return merge.replace(/\| Merge pull request (#\d+) from .*/, '($1)');
      }));
    }
  ], callback);
}
