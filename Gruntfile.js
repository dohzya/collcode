module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({

    VERSION: pkg.version,
    pkg: pkg,

    browserify: {
      dist: {
        files: {
          '<%= pkg.libname %>.js': ['src/**/*.js'],
        },
        options: {
          alias: []
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-browserify');

  // Default task.
  grunt.registerTask('default', ['browserify']);

};
