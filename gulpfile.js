// Plugins
var gulp        = require('gulp');
var browserSync = require('../node_modules/browser-sync').create();
var sass        = require('../node_modules/gulp-sass');
var babel       = require('../node_modules/gulp-babel');
var reload      = browserSync.reload;

// Directories
var SCSS_SRC = ['./app/scss/**/*.scss'];
var cssDirectory = "app/css/";

// Static Server + watching scss/html files
gulp.task('serve', ['sass'], function() {
    browserSync.init({
        server: "./app"
    });

    gulp.watch("app/scss/**/*.scss", ['sass']);
    gulp.watch("app/*.html").on('change', reload);
    gulp.watch("app/js/*.js").on('change', reload);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src("app/scss/main.scss")
        .pipe(sass())
        .pipe(gulp.dest(cssDirectory))
        .pipe(reload({stream: true}));
});

// Task to create a basic service-worker which caches static files
gulp.task('sw', function(callback) {
  var path = require('path');
  var swPrecache = require('sw-precache');
  var rootDir = 'app';

  swPrecache.write(path.join(rootDir, 'service-worker.js'), {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,woff,woff2}'],
    stripPrefix: rootDir
  }, callback);
});

// Demo-Task to transpile new JS into old JS
gulp.task('babel', function() {
    return gulp.src('app/js/word-class.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['serve', 'sass']);
